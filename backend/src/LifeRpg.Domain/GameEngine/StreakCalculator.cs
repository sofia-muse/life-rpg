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
}
