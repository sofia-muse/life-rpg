using LifeRpg.Domain.ValueObjects;

namespace LifeRpg.Domain.GameEngine;

/// <summary>
/// Two full side/boss XP payouts per hero calendar day. Dailies are not counted.
/// A boss saga spends one slot for every step of that quest today.
/// </summary>
public static class BonusPayouts
{
    public const int DailySideBossLimit = 2;

    public static bool TryTake(HeroSettings settings, DateOnly today, Guid questId = default, bool isBoss = false)
    {
        var todayText = today.ToString("yyyy-MM-dd");
        if (!string.Equals(settings.BonusPayoutDate, todayText, StringComparison.Ordinal))
        {
            settings.BonusPayoutDate = todayText;
            settings.BonusPayoutsUsed = 0;
            settings.OpenBossPayoutIds = new List<string>();
        }

        settings.OpenBossPayoutIds ??= new List<string>();
        var id = questId.ToString();
        if (isBoss && settings.OpenBossPayoutIds.Any(existing => string.Equals(existing, id, StringComparison.OrdinalIgnoreCase)))
        {
            return true;
        }

        if (settings.BonusPayoutsUsed >= DailySideBossLimit)
        {
            return false;
        }

        settings.BonusPayoutsUsed += 1;
        if (isBoss)
        {
            settings.OpenBossPayoutIds.Add(id);
        }

        return true;
    }
}
