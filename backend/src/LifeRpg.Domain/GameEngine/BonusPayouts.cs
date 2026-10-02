using LifeRpg.Domain.ValueObjects;

namespace LifeRpg.Domain.GameEngine;

/// <summary>Two full side/boss XP payouts per hero calendar day. Dailies are not counted.</summary>
public static class BonusPayouts
{
    public const int DailySideBossLimit = 2;

    public static bool TryTake(HeroSettings settings, DateOnly today)
    {
        var todayText = today.ToString("yyyy-MM-dd");
        if (!string.Equals(settings.BonusPayoutDate, todayText, StringComparison.Ordinal))
        {
            settings.BonusPayoutDate = todayText;
            settings.BonusPayoutsUsed = 0;
        }

        if (settings.BonusPayoutsUsed >= DailySideBossLimit)
        {
            return false;
        }

        settings.BonusPayoutsUsed += 1;
        return true;
    }
}
