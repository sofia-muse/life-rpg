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
        var hero = await HeroAsync(ct);
        if (hero is null)
        {
            return Result<QuestDto>.NotFound("Hero not found");
        }
        if (string.IsNullOrWhiteSpace(req.Title))
        {
            return Result<QuestDto>.Validation("Title is required");
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
            IsActive = true,
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
        var hero = await _db.Heroes
            .Include(h => h.UnlockedSkills)
            .Include(h => h.GeneratedSkills)
            .FirstOrDefaultAsync(h => _user.UserId != null && h.UserId == _user.UserId, ct);
        if (hero is null)
        {
            return Result<CompleteQuestResult>.NotFound("Hero not found");
        }

        var quest = await _db.Quests.FirstOrDefaultAsync(q => q.Id == questId && q.HeroId == hero.Id, ct);
        if (quest is null)
        {
            return Result<CompleteQuestResult>.NotFound("Quest not found");
        }

        var today = _clock.Today;

        // Anti-cheat: a daily quest can only be completed once per calendar day.
        if (quest.Type == QuestType.Daily)
        {
            var alreadyToday = await _db.QuestCompletions.AnyAsync(
                c => c.QuestId == quest.Id && c.CompletionDate == today, ct);
            if (alreadyToday)
            {
                return Result<CompleteQuestResult>.Conflict("Daily quest already completed today");
            }
        }

        // 1. Reward: streak multiplier × skill bonus, computed server-side.
        var unlockedIds = hero.UnlockedSkills.Select(s => s.SkillId).ToList();
        var streakMultiplier = StreakCalculator.GetMultiplier(hero.CurrentStreak);
        var skillBonus = SkillResolver.GetSkillBonusForStat(quest.Stat, unlockedIds)
            + SkillResolver.GetForgedBonusForStat(quest.Stat, hero.GeneratedSkills);
        var reward = XpCalculator.CalculateXpReward(quest.Difficulty, streakMultiplier, skillBonus);

        // 2. Apply XP and recompute progression.
        var oldTier = hero.ClassTier;
        var application = XpCalculator.ApplyXp(hero.StatXp[quest.Stat], reward.TotalXp);
        hero.StatXp[quest.Stat] = application.NewXp;
        HeroService.RecomputeProgression(hero);

        // 3. Newly unlocked skills.
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

        // 4. Streak advance (once per day).
        AdvanceStreak(hero, today);

        // 5. Quest + counters + audit.
        quest.IsCompleted = true;
        quest.CompletedAt = _clock.UtcNow;
        quest.Streak += 1;
        quest.BestStreak = Math.Max(quest.BestStreak, quest.Streak);
        quest.DaysCompleted += 1;
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

        await _db.SaveChangesAsync(ct);

        TierUpDto? tierUp = hero.ClassTier > oldTier
            ? new TierUpDto(hero.ClassTier, hero.ClassName)
            : null;

        var result = new CompleteQuestResult(
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
            hero.ToDto());

        return Result<CompleteQuestResult>.Success(result);
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
}
