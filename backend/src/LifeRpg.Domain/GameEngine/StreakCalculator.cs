using LifeRpg.Domain.GameConfig;

namespace LifeRpg.Domain.GameEngine;

/// <summary>Streak multipliers &amp; continuity. Faithful port of the client's streakEngine.</summary>
public static class StreakCalculator
{
    public static double GetMultiplier(int streakDays)
    {
        var multiplier = 1.0;
        foreach (var milestone in StreakMilestones.All)
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
