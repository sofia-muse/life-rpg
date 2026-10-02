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
        if (hero is null)
        {
            return Result<HeroDto>.NotFound("Hero not found");
        }

        var recent = await LoadWeekCompletionsAsync(hero, ct);
        return Result<HeroDto>.Success(hero.ToDto(recent));
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

        if (req.FocusStats.Count > 0)
        {
            hero.DominantStat = req.FocusStats[0];
            hero.ClassTier = 1;
            hero.ClassName = ClassDefinitions.GetClassName(hero.DominantStat, hero.ClassTier);
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
            .Include(h => h.UnlockedSkills)
            .FirstOrDefaultAsync(h => _user.UserId != null && h.UserId == _user.UserId, ct);
        if (hero is null)
        {
            return Result<WeeklyCupDto>.NotFound("Hero not found");
        }

        var today = HeroCalendar.Today(hero.Settings.TimeZone, _clock.UtcNow);
        var path = hero.Settings.WeeklyPath?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(path) || hero.Settings.WeeklyPathWeekKey != WeekKey(today))
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
        var weekCompletions = await LoadWeekCompletionsAsync(hero, ct);
        var completedMatches = weekCompletions.Count(entry => statSet.Contains(entry.Stat));
        requiredCount += SkillResolver.GetWeeklyCapacityBonus(hero.UnlockedSkills.Select(s => s.SkillId));

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
            hero.Settings.WeeklyRewardBadge ?? rewardBadge,
            weekCompletions));
    }

    public async Task<Result<HeroDto>> ClaimWeeklyRewardAsync(CancellationToken ct = default)
    {
        var hero = await _db.Heroes
            .Include(h => h.UnlockedSkills)
            .FirstOrDefaultAsync(h => _user.UserId != null && h.UserId == _user.UserId, ct);
        if (hero is null)
        {
            return Result<HeroDto>.NotFound("Hero not found");
        }

        var today = HeroCalendar.Today(hero.Settings.TimeZone, _clock.UtcNow);
        var path = hero.Settings.WeeklyPath?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(path) || hero.Settings.WeeklyPathWeekKey != WeekKey(today))
        {
            return Result<HeroDto>.Conflict("No weekly path is active");
        }

        if (hero.Settings.WeeklyRewardWeekKey == hero.Settings.WeeklyPathWeekKey)
        {
            return Result<HeroDto>.Success(hero.ToDto(await LoadWeekCompletionsAsync(hero, ct)));
        }

        var (stats, rewardTitle, rewardBadge, requiredCount) = path switch
        {
            "power" => (new[] { StatName.Strength, StatName.Vitality }, "Vanguard of Power", "Power Cup", 4),
            "focus" => (new[] { StatName.Intelligence, StatName.Dexterity }, "Sage of Focus", "Focus Cup", 4),
            "support" => (new[] { StatName.Charisma, StatName.Willpower }, "Warden of Support", "Support Cup", 4),
            _ => (Array.Empty<StatName>(), "Weekly Reward", "Weekly Cup", 4),
        };

        var statSet = stats.ToHashSet();
        var weekCompletions = await LoadWeekCompletionsAsync(hero, ct);
        var completedMatches = weekCompletions.Count(entry => statSet.Contains(entry.Stat));
        requiredCount += SkillResolver.GetWeeklyCapacityBonus(hero.UnlockedSkills.Select(s => s.SkillId));
        if (completedMatches < requiredCount)
        {
            return Result<HeroDto>.Conflict("Weekly contract is not complete");
        }

        hero.Settings.WeeklyRewardWeekKey = hero.Settings.WeeklyPathWeekKey;
        hero.Settings.WeeklyRewardTitle = rewardTitle;
        hero.Settings.WeeklyRewardBadge = rewardBadge;
        await _db.SaveChangesAsync(ct);
        return Result<HeroDto>.Success(hero.ToDto(weekCompletions));
    }

    private Task<Hero?> LoadAsync(CancellationToken ct) =>
        _user.UserId is { } userId
            ? _db.Heroes
                .Include(h => h.UnlockedSkills)
                .FirstOrDefaultAsync(h => h.UserId == userId, ct)
            : Task.FromResult<Hero?>(null);

    /// <summary>
    /// Recomputes levels and hero level from stat XP. The class stays put until the tier rises,
    /// and then it follows the stat that actually leads the current class stat.
    /// </summary>
    internal static void RecomputeProgression(Hero hero)
    {
        hero.Stats = StatCalculator.GetStatBlock(hero.StatXp);
        hero.HeroLevel = StatCalculator.CalculateHeroLevel(hero.StatXp);
        var newTier = ClassDefinitions.GetTierForLevel(hero.HeroLevel);
        if (newTier > hero.ClassTier)
        {
            var classStat = StatCalculator.ResolveClassStat(hero.StatXp, hero.DominantStat);
            hero.DominantStat = classStat;
            hero.ClassTier = newTier;
            hero.ClassName = ClassDefinitions.GetClassName(classStat, newTier);
        }
    }

    public async Task<Result<HeroDto>> TakeRestAsync(CancellationToken ct = default)
    {
        var hero = await LoadAsync(ct);
        if (hero is null)
        {
            return Result<HeroDto>.NotFound("Hero not found");
        }

        var today = HeroCalendar.Today(hero.Settings.TimeZone, _clock.UtcNow);
        var unlocked = hero.UnlockedSkills.Select(s => s.SkillId).ToList();
        var vitalityLevel = XpTable.LevelFromXp(hero.StatXp[StatName.Vitality]);
        var decision = RestDayResolver.Resolve(hero, today, vitalityLevel, unlocked);
        if (!decision.Granted)
        {
            return Result<HeroDto>.Success(hero.ToDto());
        }

        var application = XpCalculator.ApplyXp(hero.StatXp[StatName.Vitality], decision.Xp);
        hero.StatXp[StatName.Vitality] = application.NewXp;
        hero.CurrentStreak = decision.CurrentStreak;
        hero.LongestStreak = decision.LongestStreak;
        hero.LastActiveDate = decision.LastActiveDate;
        hero.LastStreakFreezeDate = decision.LastStreakFreezeDate;
        hero.RestDaysUsed = decision.RestDaysUsed;
        hero.Settings.RecentRestDates = decision.RecentRestDates.ToList();
        RecomputeProgression(hero);
        await _db.SaveChangesAsync(ct);
        return Result<HeroDto>.Success(hero.ToDto());
    }

    public async Task<Result<HeroDto>> RespecAsync(StatName stat, CancellationToken ct = default)
    {
        var hero = await LoadAsync(ct);
        if (hero is null)
        {
            return Result<HeroDto>.NotFound("Hero not found");
        }

        if (!Enum.IsDefined(stat))
        {
            return Result<HeroDto>.Validation("Unknown stat");
        }

        hero.DominantStat = stat;
        hero.ClassName = ClassDefinitions.GetClassName(stat, hero.ClassTier);
        await _db.SaveChangesAsync(ct);
        return Result<HeroDto>.Success(hero.ToDto());
    }

    /// <summary>
    /// Completions whose calendar date falls in the hero's current week.
    /// A daily reset clears <c>IsCompleted</c> the next morning, so the cup reads these rows.
    /// </summary>
    private async Task<List<CompletionLogDto>> LoadWeekCompletionsAsync(Hero hero, CancellationToken ct)
    {
        var today = HeroCalendar.Today(hero.Settings.TimeZone, _clock.UtcNow);
        if (!DateOnly.TryParse(WeekKey(today), out var weekStart))
        {
            return new List<CompletionLogDto>();
        }

        var weekEnd = weekStart.AddDays(7);
        var rows = await _db.QuestCompletions
            .Where(c => c.HeroId == hero.Id && c.CompletionDate >= weekStart && c.CompletionDate < weekEnd)
            .Select(c => new { c.QuestId, c.CompletionDate, c.Stat })
            .ToListAsync(ct);
        return rows
            .Select(c => new CompletionLogDto(c.QuestId, c.CompletionDate.ToString("yyyy-MM-dd"), c.Stat))
            .ToList();
    }

    private static string WeekKey(DateOnly date)
    {
        var diff = ((int)date.DayOfWeek + 6) % 7;
        return date.AddDays(-diff).ToString("yyyy-MM-dd");
    }
}
