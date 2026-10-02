using LifeRpg.Domain.ValueObjects;

namespace LifeRpg.Domain.GameEngine;

/// <summary>
/// Daily quest XP stops at the number of daily slots the hero can hold that day.
/// Extra completions still close the quest. Deleting a quest does not refill the slots.
/// </summary>
public static class DailyXpBudget
{
    public const int BaseActiveDailyLimit = 3;

    public static bool TryTake(HeroSettings settings, DateOnly today, int slotCount)
    {
        var todayText = today.ToString("yyyy-MM-dd");
        if (!string.Equals(settings.DailyXpDate, todayText, StringComparison.Ordinal))
        {
            settings.DailyXpDate = todayText;
            settings.DailyXpPayoutsUsed = 0;
        }

        var limit = Math.Max(0, slotCount);
        if (settings.DailyXpPayoutsUsed >= limit)
        {
            return false;
        }

        settings.DailyXpPayoutsUsed += 1;
        return true;
    }
}
