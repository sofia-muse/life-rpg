using LifeRpg.Application.Common;
using LifeRpg.Application.Dtos;
using LifeRpg.Domain.Entities;
using LifeRpg.Domain.Enums;
using LifeRpg.Domain.GameConfig;
using LifeRpg.Domain.GameEngine;
using LifeRpg.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;

namespace LifeRpg.Application.Services;

public class HeroService
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _user;
    private readonly IClock _clock;

    public HeroService(IAppDbContext db, ICurrentUser user, IClock clock)
    {
        _db = db;
        _user = user;
        _clock = clock;
    }

    public async Task<Result<HeroDto>> GetMineAsync(CancellationToken ct = default)
    {
        var hero = await LoadAsync(ct);
        return hero is null ? Result<HeroDto>.NotFound("Hero not found") : Result<HeroDto>.Success(hero.ToDto());
    }

    public async Task<Result<HeroDto>> CreateAsync(CreateHeroRequest req, CancellationToken ct = default)
    {
        if (_user.UserId is not { } userId)
        {
            return Result<HeroDto>.Unauthorized();
        }

        if (await _db.Heroes.AnyAsync(h => h.UserId == userId, ct))
        {
            return Result<HeroDto>.Conflict("Hero already exists for this user");
        }

        if (string.IsNullOrWhiteSpace(req.Name))
        {
            return Result<HeroDto>.Validation("Name is required");
        }

        var hero = new Hero
        {
            UserId = userId,
            Name = req.Name.Trim(),
            AvatarSeed = string.IsNullOrWhiteSpace(req.AvatarSeed) ? req.Name.Trim() : req.AvatarSeed,
            StatXp = new StatBlock(0),
            CharacterAppearance = req.CharacterAppearance ?? new CharacterAppearance(),
        };

        // Seed each focus stat with 50 XP (matches the client's createHero).
        foreach (var stat in req.FocusStats.Distinct())
        {
            hero.StatXp[stat] = 50;
        }

        RecomputeProgression(hero);
        // LastActiveDate stays null so the first quest completion starts the streak at 1.

        _db.Heroes.Add(hero);
        await _db.SaveChangesAsync(ct);
        return Result<HeroDto>.Success(hero.ToDto());
    }

    public async Task<Result<HeroDto>> UpdateAppearanceAsync(UpdateAppearanceRequest req, CancellationToken ct = default)
    {
        var hero = await LoadAsync(ct);
        if (hero is null)
        {
            return Result<HeroDto>.NotFound("Hero not found");
        }

        if (req.Appearance is not null)
        {
            hero.Appearance = req.Appearance;
        }
        if (req.CharacterAppearance is not null)
        {
            hero.CharacterAppearance = req.CharacterAppearance;
        }

        await _db.SaveChangesAsync(ct);
        return Result<HeroDto>.Success(hero.ToDto());
    }

    public async Task<Result> DeleteAsync(CancellationToken ct = default)
    {
        var hero = await LoadAsync(ct);
        if (hero is null)
        {
            return Result.NotFound("Hero not found");
        }

        _db.Heroes.Remove(hero);
        await _db.SaveChangesAsync(ct);
        return Result.Success();
    }

    public async Task<Result<List<StatProgressDto>>> GetStatsAsync(CancellationToken ct = default)
    {
        var hero = await LoadAsync(ct);
        if (hero is null)
        {
            return Result<List<StatProgressDto>>.NotFound("Hero not found");
        }

        var list = Stats.All.Select(stat =>
        {
            var xp = hero.StatXp[stat];
            var (currentXp, xpNeeded, progress) = XpTable.XpProgressInLevel(xp);
            return new StatProgressDto(stat, XpTable.LevelFromXp(xp), currentXp, xpNeeded, progress);
        }).ToList();

        return Result<List<StatProgressDto>>.Success(list);
    }

    public async Task<Result<WeeklyCupDto>> GetWeeklyCupAsync(CancellationToken ct = default)
    {
        var hero = await _db.Heroes
            .Include(h => h.Quests)
            .FirstOrDefaultAsync(h => _user.UserId != null && h.UserId == _user.UserId, ct);
        if (hero is null)
        {
            return Result<WeeklyCupDto>.NotFound("Hero not found");
        }

        var path = hero.Settings.WeeklyPath?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(path) || hero.Settings.WeeklyPathWeekKey != WeekKey(_clock.Today))
        {
            return Result<WeeklyCupDto>.Conflict("No weekly path is active");
        }

        var (stats, label, rewardTitle, rewardBadge, requiredCount) = path switch
        {
            "power" => (new[] { StatName.Strength, StatName.Vitality }, "Power", "Vanguard of Power", "Power Cup", 4),
            "focus" => (new[] { StatName.Intelligence, StatName.Dexterity }, "Focus", "Sage of Focus", "Focus Cup", 4),
            "support" => (new[] { StatName.Charisma, StatName.Willpower }, "Support", "Warden of Support", "Support Cup", 4),
            _ => (Array.Empty<StatName>(), "Unknown", "Weekly Reward", "Weekly Cup", 4),
        };

        var statSet = stats.ToHashSet();
        var completedMatches = hero.Quests.Count(q =>
            q.IsCompleted
            && statSet.Contains(q.Stat)
            && q.CompletedAt is { } completedAt
            && WeekKey(DateOnly.FromDateTime(completedAt.UtcDateTime)) == hero.Settings.WeeklyPathWeekKey);

        var bossProgress = Math.Min(20, (int)Math.Round(hero.Quests
            .Where(q => q.Type == QuestType.Boss && statSet.Contains(q.Stat) && q.TotalSteps is > 0)
            .Sum(q => ((double)(q.CompletedSteps ?? 0) / q.TotalSteps!.Value) * 20)));

        var contractProgress = Math.Min(60, (int)Math.Round((double)completedMatches / Math.Max(requiredCount, 1) * 60));
        var streakBoost = Math.Min(10, hero.CurrentStreak);
        var rewardBoost = hero.Settings.WeeklyRewardWeekKey == hero.Settings.WeeklyPathWeekKey ? 10 : 0;
        var score = Math.Min(100, contractProgress + bossProgress + streakBoost + rewardBoost);
        var rank = score >= 85 ? "mythic" : score >= 65 ? "gold" : score >= 40 ? "silver" : "bronze";

        return Result<WeeklyCupDto>.Success(new WeeklyCupDto(
            $"{label} Cup",
            $"{label} Path",
            score,
            rank,
            completedMatches,
            requiredCount,
            bossProgress,
            streakBoost,
            hero.Settings.WeeklyRewardTitle ?? rewardTitle,
            hero.Settings.WeeklyRewardBadge ?? rewardBadge));
    }

    private Task<Hero?> LoadAsync(CancellationToken ct) =>
        _user.UserId is { } userId
            ? _db.Heroes
                .Include(h => h.UnlockedSkills)
                .FirstOrDefaultAsync(h => h.UserId == userId, ct)
            : Task.FromResult<Hero?>(null);

    /// <summary>Recomputes derived progression (levels, hero level, dominant stat, class) from stat XP.</summary>
    internal static void RecomputeProgression(Hero hero)
    {
        hero.Stats = StatCalculator.GetStatBlock(hero.StatXp);
        hero.HeroLevel = StatCalculator.CalculateHeroLevel(hero.StatXp);
        hero.DominantStat = StatCalculator.GetDominantStat(hero.StatXp);
        hero.ClassTier = ClassDefinitions.GetTierForLevel(hero.HeroLevel);
        hero.ClassName = ClassDefinitions.GetClassName(hero.DominantStat, hero.ClassTier);
    }

    private static string WeekKey(DateOnly date)
    {
        var diff = ((int)date.DayOfWeek + 6) % 7;
        return date.AddDays(-diff).ToString("yyyy-MM-dd");
    }
}
