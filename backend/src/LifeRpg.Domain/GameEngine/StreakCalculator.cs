using LifeRpg.Domain.GameConfig;

namespace LifeRpg.Domain.GameEngine;

/// <summary>Streak multipliers &amp; continuity. Faithful port of the client's streakEngine.</summary>
public static class StreakCalculator
{
    /// <summary>Quest-local streak multiplier. Climbs to 3.0. Dailies only.</summary>
    public static double GetMultiplier(int streakDays) => MultiplierFor(streakDays, StreakMilestones.All);

    /// <summary>Hero-wide show-up bonus. Caps at 1.5 so one life-streak cannot triple every quest.</summary>
    public static readonly IReadOnlyList<StreakMilestone> HeroMilestones = new[]
    {
        new StreakMilestone(3, 1.05, "Getting Started"),
        new StreakMilestone(7, 1.1, "One Week Strong"),
        new StreakMilestone(14, 1.15, "Two Weeks!"),
        new StreakMilestone(30, 1.2, "Monthly Master"),
        new StreakMilestone(60, 1.25, "Iron Habit"),
        new StreakMilestone(90, 1.35, "Legendary Streak"),
        new StreakMilestone(180, 1.4, "Half-Year Hero"),
        new StreakMilestone(365, 1.5, "Yearly Legend"),
    };

    public static double GetHeroMultiplier(int streakDays) => MultiplierFor(streakDays, HeroMilestones);

    private static double MultiplierFor(int streakDays, IReadOnlyList<StreakMilestone> milestones)
    {
        var multiplier = 1.0;
        foreach (var milestone in milestones)
        {
            if (streakDays >= milestone.Days)
            {
                multiplier = milestone.Multiplier;
            }
        }
        return multiplier;
    }

    public static StreakMilestone? GetNextMilestone(int streakDays) =>
        StreakMilestones.All.FirstOrDefault(m => streakDays < m.Days);

    public static StreakMilestone? GetCurrentMilestone(int streakDays)
    {
        StreakMilestone? current = null;
        foreach (var milestone in StreakMilestones.All)
        {
            if (streakDays >= milestone.Days)
            {
                current = milestone;
            }
        }
        return current;
    }

    /// <summary>True if more than one day elapsed (a day was missed). Dates are UTC dates.</summary>
    public static bool ShouldResetStreak(DateOnly lastActiveDate, DateOnly today) =>
        today.DayNumber - lastActiveDate.DayNumber > 1;

    public static bool IsNewDay(DateOnly lastActiveDate, DateOnly today) => lastActiveDate != today;

    /// <summary>Streak retained after a break: 50% with Regeneration, otherwise 0.</summary>
    public static int GetStreakAfterBreak(int currentStreak, bool hasRegenerationSkill) =>
        hasRegenerationSkill ? (int)Math.Floor(currentStreak * 0.5) : 0;

    public static int? DaysUntilNextMilestone(int streakDays)
    {
        var next = GetNextMilestone(streakDays);
        return next is null ? null : next.Days - streakDays;
    }

    public const int FreezeCooldownDays = 7;

    public readonly record struct StreakAdvance(int Streak, DateOnly? LastFreezeDate, bool UsedFreeze);

    /// <summary>
    /// Move a streak across calendar days. A one-day gap continues. A wider gap keeps the
    /// chain only with a freeze or a retention ratio. <paramref name="brokenDayCounts"/>
    /// makes a broken quest completed today start at 1; the hero's return day can stay at 0.
    /// </summary>
    public static StreakAdvance Advance(
        int currentStreak,
        DateOnly? lastDate,
        DateOnly today,
        DateOnly? lastFreezeDate,
        int freezeAllowance,
        double retentionRatio,
        bool missingDateStartsAtOne = false,
        bool brokenDayCounts = false,
        bool freezeAlreadyUsed = false)
    {
        if (lastDate is null)
        {
            var started = missingDateStartsAtOne ? Math.Max(currentStreak, 1) : currentStreak;
            return new StreakAdvance(started, lastFreezeDate, false);
        }

        var gap = today.DayNumber - lastDate.Value.DayNumber;
        if (gap <= 0)
        {
            return new StreakAdvance(currentStreak, lastFreezeDate, false);
        }

        if (gap == 1)
        {
            return new StreakAdvance(currentStreak + 1, lastFreezeDate, false);
        }

        var freezeReady = freezeAlreadyUsed || (freezeAllowance > 0 && !FreezeUsedRecently(lastFreezeDate, today));
        if (freezeReady)
        {
            return new StreakAdvance(
                currentStreak,
                freezeAlreadyUsed ? lastFreezeDate : today,
                !freezeAlreadyUsed);
        }

        var kept = retentionRatio > 0
            ? (int)Math.Floor(currentStreak * retentionRatio)
            : GetStreakAfterBreak(currentStreak, false);
        if (brokenDayCounts)
        {
            kept = Math.Max(kept, 1);
        }

        return new StreakAdvance(kept, lastFreezeDate, false);
    }

    private static bool FreezeUsedRecently(DateOnly? lastFreezeDate, DateOnly today) =>
        lastFreezeDate is { } used && today.DayNumber - used.DayNumber >= 0 && today.DayNumber - used.DayNumber < FreezeCooldownDays;
}
