using LifeRpg.Domain.Entities;

namespace LifeRpg.Domain.GameEngine;

public readonly record struct RestDayDecision(
    bool Granted,
    int Xp,
    int CurrentStreak,
    int LongestStreak,
    DateOnly LastActiveDate,
    DateOnly? LastStreakFreezeDate,
    IReadOnlyList<string> RecentRestDates,
    int RestDaysUsed);

/// <summary>Faithful port of the client's restDay resolver.</summary>
public static class RestDayResolver
{
    public const int RestWindowDays = 7;

    public static RestDayDecision Resolve(Hero hero, DateOnly today, int vitalityLevel, IReadOnlyCollection<string> unlockedSkillIds)
    {
        var recent = (hero.Settings.RecentRestDates ?? new List<string>())
            .Where(date =>
            {
                if (!DateOnly.TryParse(date, out var parsed)) return false;
                var gap = today.DayNumber - parsed.DayNumber;
                return gap >= 0 && gap < RestWindowDays;
            })
            .ToList();

        if (recent.Contains(today.ToString("yyyy-MM-dd"))
            || recent.Count >= SkillResolver.GetRestDayAllowance(unlockedSkillIds))
        {
            return new RestDayDecision(
                false,
                0,
                hero.CurrentStreak,
                hero.LongestStreak,
                hero.LastActiveDate ?? today,
                hero.LastStreakFreezeDate,
                recent,
                hero.RestDaysUsed);
        }

        var advance = Continue(hero, today, unlockedSkillIds);
        var xp = SkillResolver.GetRestDayXpReward(unlockedSkillIds) + Math.Max(0, vitalityLevel);
        recent.Add(today.ToString("yyyy-MM-dd"));
        return new RestDayDecision(
            true,
            xp,
            advance.Streak,
            Math.Max(hero.LongestStreak, advance.Streak),
            advance.LastActiveDate,
            advance.LastFreezeDate,
            recent,
            hero.RestDaysUsed + 1);
    }

    private readonly record struct Continued(int Streak, DateOnly LastActiveDate, DateOnly? LastFreezeDate);

    private static Continued Continue(Hero hero, DateOnly today, IReadOnlyCollection<string> unlockedSkillIds)
    {
        if (hero.LastActiveDate is null)
        {
            return new Continued(Math.Max(hero.CurrentStreak, 1), today, hero.LastStreakFreezeDate);
        }

        if (hero.LastActiveDate == today)
        {
            return new Continued(Math.Max(hero.CurrentStreak, 1), hero.LastActiveDate.Value, hero.LastStreakFreezeDate);
        }

        var advance = StreakCalculator.Advance(
            hero.CurrentStreak,
            hero.LastActiveDate,
            today,
            hero.LastStreakFreezeDate,
            SkillResolver.GetWeeklyStreakFreezeAllowance(unlockedSkillIds),
            SkillResolver.GetStreakRetentionRatio(unlockedSkillIds));
        return new Continued(advance.Streak, today, advance.LastFreezeDate);
    }
}
