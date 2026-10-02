using LifeRpg.Application.Common;
using LifeRpg.Application.Dtos;
using LifeRpg.Domain.Entities;
using LifeRpg.Domain.Enums;
using LifeRpg.Domain.GameConfig;
using LifeRpg.Domain.GameEngine;
using Microsoft.EntityFrameworkCore;

namespace LifeRpg.Application.Services;

public class QuestService
{
    private const int BaseActiveDailyLimit = 3;
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _user;
    private readonly IClock _clock;

    public QuestService(IAppDbContext db, ICurrentUser user, IClock clock)
    {
        _db = db;
        _user = user;
        _clock = clock;
    }

    public async Task<Result<List<QuestDto>>> ListAsync(QuestType? type, bool? active, CancellationToken ct = default)
    {
        var hero = await HeroAsync(ct);
        if (hero is null)
        {
            return Result<List<QuestDto>>.NotFound("Hero not found");
        }

        await ResetExpiredDailyQuestsAsync(hero, ct);

        var query = _db.Quests.Where(q => q.HeroId == hero.Id);
        if (type is { } t)
        {
            query = query.Where(q => q.Type == t);
        }
        if (active is { } a)
        {
            query = query.Where(q => q.IsActive == a);
        }

        // Order in memory: SQLite (tests) can't ORDER BY DateTimeOffset; quest lists are small.
        var quests = await query.ToListAsync(ct);
        return Result<List<QuestDto>>.Success(
            quests.OrderByDescending(q => q.CreatedAt).Select(q => q.ToDto()).ToList());
    }

    public async Task<Result<QuestDto>> CreateAsync(CreateQuestRequest req, CancellationToken ct = default)
    {
        var hero = await _db.Heroes
            .Include(h => h.UnlockedSkills)
            .FirstOrDefaultAsync(h => _user.UserId != null && h.UserId == _user.UserId, ct);
        if (hero is null)
        {
            return Result<QuestDto>.NotFound("Hero not found");
        }
        if (string.IsNullOrWhiteSpace(req.Title))
        {
            return Result<QuestDto>.Validation("Title is required");
        }
        if (req.Type == QuestType.Boss && req.TotalSteps is <= 0)
        {
            return Result<QuestDto>.Validation("Boss quests must have at least one step");
        }

        var quest = new Quest
        {
            HeroId = hero.Id,
            Title = req.Title.Trim(),
            Description = req.Description?.Trim() ?? string.Empty,
            Type = req.Type,
            Difficulty = req.Difficulty,
            Stat = req.Stat,
            // Server owns the XP value — never trust a client-sent reward.
            XpReward = DifficultyXp.For(req.Difficulty),
            IsActive = req.Type != QuestType.Daily || await CanActivateDailyQuestAsync(hero, null, ct),
            TotalSteps = req.Type == QuestType.Boss ? req.TotalSteps ?? 3 : null,
            CompletedSteps = req.Type == QuestType.Boss ? 0 : null,
            EvolutionPathId = string.IsNullOrWhiteSpace(req.EvolutionPathId) ? null : req.EvolutionPathId.Trim(),
        };

        _db.Quests.Add(quest);
        await _db.SaveChangesAsync(ct);
        return Result<QuestDto>.Success(quest.ToDto());
    }

    public async Task<Result> DeleteAsync(Guid questId, CancellationToken ct = default)
    {
        var hero = await HeroAsync(ct);
        if (hero is null)
        {
            return Result.NotFound("Hero not found");
        }

        var quest = await _db.Quests.FirstOrDefaultAsync(q => q.Id == questId && q.HeroId == hero.Id, ct);
        if (quest is null)
        {
            return Result.NotFound("Quest not found");
        }

        _db.Quests.Remove(quest);
        await _db.SaveChangesAsync(ct);
        return Result.Success();
    }

    /// <summary>
    /// Server-authoritative quest completion. The server recomputes XP/level/class/skills from the
    /// domain engine and ignores any client-claimed progression (anti-cheat).
    /// </summary>
    public async Task<Result<CompleteQuestResult>> CompleteAsync(Guid questId, CancellationToken ct = default)
    {
        var hero = await LoadHeroForProgressionAsync(ct);
        if (hero is null)
        {
            return Result<CompleteQuestResult>.NotFound("Hero not found");
        }

        var quest = await _db.Quests.FirstOrDefaultAsync(q => q.Id == questId && q.HeroId == hero.Id, ct);
        if (quest is null)
        {
            return Result<CompleteQuestResult>.NotFound("Quest not found");
        }

        await ResetExpiredDailyQuestsAsync(hero, ct);
        return await CompleteLoadedQuestAsync(hero, quest, ct, requireBossSteps: true);
    }

    public async Task<Result<AdvanceBossQuestResult>> AdvanceBossStepAsync(Guid questId, CancellationToken ct = default)
    {
        var hero = await LoadHeroForProgressionAsync(ct);
        if (hero is null)
        {
            return Result<AdvanceBossQuestResult>.NotFound("Hero not found");
        }

        var quest = await _db.Quests.FirstOrDefaultAsync(q => q.Id == questId && q.HeroId == hero.Id, ct);
        if (quest is null)
        {
            return Result<AdvanceBossQuestResult>.NotFound("Quest not found");
        }

        await ResetExpiredDailyQuestsAsync(hero, ct);
        if (quest.Type != QuestType.Boss || quest.TotalSteps is null)
        {
            return Result<AdvanceBossQuestResult>.Conflict("Quest does not use boss-step progression");
        }

        if (!quest.IsActive)
        {
            return Result<AdvanceBossQuestResult>.Conflict("Inactive quest cannot be advanced");
        }
        if (quest.IsCompleted)
        {
            return Result<AdvanceBossQuestResult>.Conflict("Quest already completed");
        }

        quest.CompletedSteps = Math.Min((quest.CompletedSteps ?? 0) + 1, quest.TotalSteps.Value);
        if (quest.CompletedSteps < quest.TotalSteps.Value)
        {
            var step = await CompleteLoadedQuestAsync(hero, quest, ct, requireBossSteps: false, markComplete: false);
            return step.Succeeded
                ? Result<AdvanceBossQuestResult>.Success(new AdvanceBossQuestResult(quest.ToDto(), step.Value))
                : Result<AdvanceBossQuestResult>.Failure(step.ErrorType, step.Error ?? "Boss step failed");
        }

        var completion = await CompleteLoadedQuestAsync(hero, quest, ct, requireBossSteps: false);
        return completion.Succeeded
            ? Result<AdvanceBossQuestResult>.Success(new AdvanceBossQuestResult(quest.ToDto(), completion.Value!))
            : Result<AdvanceBossQuestResult>.Failure(completion.ErrorType, completion.Error ?? "Boss step failed");
    }

    private async Task<Result<CompleteQuestResult>> CompleteLoadedQuestAsync(
        Hero hero,
        Quest quest,
        CancellationToken ct,
        bool requireBossSteps,
        bool markComplete = true)
    {
        if (!quest.IsActive)
        {
            return Result<CompleteQuestResult>.Conflict("Inactive quest cannot be completed");
        }
        if (quest.IsCompleted && quest.Type != QuestType.Daily)
        {
            return Result<CompleteQuestResult>.Conflict("Quest already completed");
        }
        if (quest.Type == QuestType.Boss
            && requireBossSteps
            && quest.TotalSteps is { } totalSteps
            && (quest.CompletedSteps ?? 0) < totalSteps)
        {
            return Result<CompleteQuestResult>.Conflict("Boss quest requires step progression");
        }

        var today = TodayFor(hero);

        if (quest.Type == QuestType.Daily)
        {
            var alreadyToday = await _db.QuestCompletions.AnyAsync(
                c => c.QuestId == quest.Id && c.CompletionDate == today, ct);
            if (alreadyToday)
            {
                return Result<CompleteQuestResult>.Conflict("Daily quest already completed today");
            }
        }

        var unlockedIds = hero.UnlockedSkills.Select(s => s.SkillId).ToList();
        var heroAdvance = AdvanceStreak(hero, today, unlockedIds);
        var questStreak = quest.Streak;
        DateOnly? questStreakDate = quest.LastStreakDate;
        var questFreezeUsed = false;
        if (quest.Type == QuestType.Daily && markComplete)
        {
            var questAdvance = StreakCalculator.Advance(
                quest.Streak,
                quest.LastStreakDate,
                today,
                hero.LastStreakFreezeDate,
                SkillResolver.GetWeeklyStreakFreezeAllowance(unlockedIds),
                SkillResolver.GetStreakRetentionRatio(unlockedIds),
                missingDateStartsAtOne: true,
                brokenDayCounts: true,
                freezeAlreadyUsed: heroAdvance.UsedFreeze);
            questStreak = questAdvance.Streak;
            questStreakDate = today;
            questFreezeUsed = questAdvance.UsedFreeze;
            if (questFreezeUsed)
            {
                hero.LastStreakFreezeDate = questAdvance.LastFreezeDate;
            }
        }

        var heroStreakMultiplier = StreakCalculator.GetHeroMultiplier(hero.CurrentStreak);
        var questStreakMultiplier = quest.Type == QuestType.Daily
            ? StreakCalculator.GetMultiplier(questStreak)
            : 1d;
        var skillBonus = SkillResolver.GetSkillBonusForQuest(quest.Type, quest.Stat, unlockedIds)
            + SkillResolver.GetForgedBonusForStat(quest.Stat, hero.GeneratedSkills, hero.Settings.ActiveForgedSkillIds)
            + GetWeeklyPathBonus(hero, quest, today);
        if (quest.Type == QuestType.Boss)
        {
            skillBonus += SkillResolver.GetBossStepXpBonus(unlockedIds);
        }
        var reward = XpCalculator.CalculateXpReward(quest.Difficulty, heroStreakMultiplier, skillBonus, questStreakMultiplier);
        if (quest.Type == QuestType.Boss && quest.TotalSteps is > 0)
        {
            var share = XpCalculator.BossStepShare(reward.TotalXp, quest.TotalSteps.Value, quest.CompletedSteps ?? quest.TotalSteps.Value);
            reward = reward with { TotalXp = share };
        }

        var bonusBudgetSpent = false;
        if (quest.Type != QuestType.Daily
            && !BonusPayouts.TryTake(hero.Settings, today, quest.Id, quest.Type == QuestType.Boss))
        {
            reward = reward with { TotalXp = 0 };
            bonusBudgetSpent = true;
        }

        var oldTier = hero.ClassTier;
        var application = XpCalculator.ApplyXp(hero.StatXp[quest.Stat], reward.TotalXp);
        hero.StatXp[quest.Stat] = application.NewXp;
        HeroService.RecomputeProgression(hero);

        var newSkillDefs = SkillResolver.GetNewlyUnlockedSkills(hero.StatXp, unlockedIds.ToHashSet());
        foreach (var def in newSkillDefs)
        {
            hero.UnlockedSkills.Add(new UnlockedSkill
            {
                HeroId = hero.Id,
                SkillId = def.Id,
                UnlockedAt = _clock.UtcNow,
            });
        }

        if (markComplete)
        {
            quest.IsCompleted = true;
            quest.CompletedAt = _clock.UtcNow;
            if (quest.Type == QuestType.Boss && quest.TotalSteps is { } bossSteps)
            {
                quest.CompletedSteps = bossSteps;
            }
            if (quest.Type == QuestType.Daily)
            {
                quest.Streak = questStreak;
                quest.LastStreakDate = questStreakDate;
            }
            else
            {
                quest.Streak += 1;
            }
            quest.BestStreak = Math.Max(quest.BestStreak, quest.Streak);
            quest.DaysCompleted += 1;
            QuestEvolutionResolver.Apply(quest, unlockedIds);
            hero.TotalQuestsCompleted += 1;

            _db.QuestCompletions.Add(new QuestCompletion
            {
                HeroId = hero.Id,
                QuestId = quest.Id,
                Stat = quest.Stat,
                CompletionDate = today,
                XpAwarded = reward.TotalXp,
                CompletedAt = _clock.UtcNow,
            });
        }

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException) when (quest.Type == QuestType.Daily)
        {
            return Result<CompleteQuestResult>.Conflict("Daily quest already completed today");
        }

        TierUpDto? tierUp = hero.ClassTier > oldTier
            ? new TierUpDto(hero.ClassTier, hero.ClassName)
            : null;

        return Result<CompleteQuestResult>.Success(
            new CompleteQuestResult(
                quest.Stat,
                reward.TotalXp,
                reward.BaseXp,
                reward.StreakBonus,
                reward.SkillBonus,
                application.OldLevel,
                application.NewLevel,
                application.DidLevelUp,
                tierUp,
                newSkillDefs.Select(s => s.ToDto()).ToList(),
                hero.ToDto(),
                bonusBudgetSpent));
    }

    private static StreakCalculator.StreakAdvance AdvanceStreak(Hero hero, DateOnly today, IReadOnlyCollection<string> unlockedIds)
    {
        var advance = StreakCalculator.Advance(
            hero.CurrentStreak,
            hero.LastActiveDate,
            today,
            hero.LastStreakFreezeDate,
            SkillResolver.GetWeeklyStreakFreezeAllowance(unlockedIds),
            SkillResolver.GetStreakRetentionRatio(unlockedIds),
            missingDateStartsAtOne: true,
            brokenDayCounts: true);
        hero.CurrentStreak = advance.Streak;
        hero.LongestStreak = Math.Max(hero.LongestStreak, advance.Streak);
        hero.LastActiveDate = today;
        if (advance.UsedFreeze)
        {
            hero.LastStreakFreezeDate = advance.LastFreezeDate;
        }

        return advance;
    }

    private Task<Hero?> HeroAsync(CancellationToken ct) =>
        _user.UserId is { } userId
            ? _db.Heroes.FirstOrDefaultAsync(h => h.UserId == userId, ct)
            : Task.FromResult<Hero?>(null);

    private Task<Hero?> LoadHeroForProgressionAsync(CancellationToken ct) =>
        _db.Heroes
            .Include(h => h.UnlockedSkills)
            .Include(h => h.GeneratedSkills)
            .FirstOrDefaultAsync(h => _user.UserId != null && h.UserId == _user.UserId, ct);

    private DateOnly TodayFor(Hero hero) => HeroCalendar.Today(hero.Settings.TimeZone, _clock.UtcNow);

    private async Task ResetExpiredDailyQuestsAsync(Hero hero, CancellationToken ct)
    {
        var today = TodayFor(hero);
        var dailyQuests = await _db.Quests
            .Where(q => q.HeroId == hero.Id && q.Type == QuestType.Daily && q.IsCompleted)
            .ToListAsync(ct);

        var changed = false;
        foreach (var quest in dailyQuests)
        {
            if (quest.CompletedAt is { } completedAt
                && HeroCalendar.DateInTimeZone(completedAt, hero.Settings.TimeZone) == today)
            {
                continue;
            }

            quest.IsCompleted = false;
            quest.CompletedAt = null;
            changed = true;
        }

        if (changed)
        {
            await _db.SaveChangesAsync(ct);
        }
    }

    private async Task<bool> CanActivateDailyQuestAsync(Hero hero, Guid? currentQuestId, CancellationToken ct)
    {
        var currentActiveDailyCount = await _db.Quests.CountAsync(
            q => q.HeroId == hero.Id
                && q.Type == QuestType.Daily
                && q.IsActive
                && (!currentQuestId.HasValue || q.Id != currentQuestId.Value),
            ct);
        var unlockedIds = hero.UnlockedSkills.Select(s => s.SkillId);
        var maxActiveDailyCount = BaseActiveDailyLimit + SkillResolver.GetActiveDailyQuestCapacityBonus(unlockedIds);
        return currentActiveDailyCount < maxActiveDailyCount;
    }

    private static int GetWeeklyPathBonus(Hero hero, Quest quest, DateOnly today)
    {
        var path = hero.Settings.WeeklyPath?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(path) || hero.Settings.WeeklyPathWeekKey != WeekKey(today))
        {
            return 0;
        }

        var matches = path switch
        {
            "power" => quest.Stat is StatName.Strength or StatName.Vitality,
            "focus" => quest.Stat is StatName.Intelligence or StatName.Dexterity,
            "support" => quest.Stat is StatName.Charisma or StatName.Willpower,
            _ => false,
        };

        return matches ? 5 : 0;
    }

    private static string WeekKey(DateOnly date)
    {
        var diff = ((int)date.DayOfWeek + 6) % 7;
        return date.AddDays(-diff).ToString("yyyy-MM-dd");
    }
}
