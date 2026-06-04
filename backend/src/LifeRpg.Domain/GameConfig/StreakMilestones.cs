namespace LifeRpg.Domain.GameConfig;

public sealed record StreakMilestone(int Days, double Multiplier, string Title);

/// <summary>Streak milestones &amp; multipliers. Faithful port of the client's streakEngine.</summary>
public static class StreakMilestones
{
    public static readonly IReadOnlyList<StreakMilestone> All = new[]
    {
        new StreakMilestone(3, 1.1, "Getting Started"),
        new StreakMilestone(7, 1.2, "One Week Strong"),
        new StreakMilestone(14, 1.3, "Two Weeks!"),
        new StreakMilestone(30, 1.5, "Monthly Master"),
        new StreakMilestone(60, 1.7, "Iron Habit"),
        new StreakMilestone(90, 2.0, "Legendary Streak"),
        new StreakMilestone(180, 2.5, "Half-Year Hero"),
        new StreakMilestone(365, 3.0, "Yearly Legend"),
    };
}
