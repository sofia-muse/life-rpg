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

        await ResetExpiredDailyQuestsAsync(hero.Id, ct);

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

        await ResetExpiredDailyQuestsAsync(hero.Id, ct);
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

        await ResetExpiredDailyQuestsAsync(hero.Id, ct);
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
            await _db.SaveChangesAsync(ct);
            return Result<AdvanceBossQuestResult>.Success(new AdvanceBossQuestResult(quest.ToDto(), null));
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
        bool requireBossSteps)
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

        var today = _clock.Today;

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
        var streakMultiplier = StreakCalculator.GetMultiplier(hero.CurrentStreak);
        var skillBonus = SkillResolver.GetSkillBonusForQuest(quest.Type, quest.Stat, unlockedIds)
            + SkillResolver.GetForgedBonusForStat(quest.Stat, hero.GeneratedSkills);
        var reward = XpCalculator.CalculateXpReward(quest.Difficulty, streakMultiplier, skillBonus);

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

        AdvanceStreak(hero, today);

        quest.IsCompleted = true;
        quest.CompletedAt = _clock.UtcNow;
        if (quest.Type == QuestType.Boss && quest.TotalSteps is { } bossSteps)
        {
            quest.CompletedSteps = bossSteps;
        }
        quest.Streak += 1;
        quest.BestStreak = Math.Max(quest.BestStreak, quest.Streak);
        quest.DaysCompleted += 1;
        QuestEvolutionResolver.Apply(quest);
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
                hero.ToDto()));
    }

    private void AdvanceStreak(Hero hero, DateOnly today)
    {
        if (hero.LastActiveDate == today)
        {
            return;
        }

        if (hero.LastActiveDate is { } last && !StreakCalculator.ShouldResetStreak(last, today))
        {
            hero.CurrentStreak += 1;
        }
        else
        {
            hero.CurrentStreak = 1;
        }

        hero.LongestStreak = Math.Max(hero.LongestStreak, hero.CurrentStreak);
        hero.LastActiveDate = today;
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

    private async Task ResetExpiredDailyQuestsAsync(Guid heroId, CancellationToken ct)
    {
        var today = _clock.Today;
        var dailyQuests = await _db.Quests
            .Where(q => q.HeroId == heroId && q.Type == QuestType.Daily && q.IsCompleted)
            .ToListAsync(ct);

        var changed = false;
        foreach (var quest in dailyQuests)
        {
            if (quest.CompletedAt is { } completedAt && DateOnly.FromDateTime(completedAt.UtcDateTime) == today)
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
}
