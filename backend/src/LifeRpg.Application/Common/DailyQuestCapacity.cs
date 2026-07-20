using LifeRpg.Domain.GameEngine;

namespace LifeRpg.Application.Common;

/// <summary>Shared daily-quest activation capacity (base 3 + skill bonuses).</summary>
public static class DailyQuestCapacity
{
    public const int BaseActiveDailyLimit = 3;

    public static int MaxActive(IEnumerable<string> unlockedSkillIds) =>
        BaseActiveDailyLimit + SkillResolver.GetActiveDailyQuestCapacityBonus(unlockedSkillIds);

    public static bool CanActivate(int currentActiveDailyCount, IEnumerable<string> unlockedSkillIds) =>
        currentActiveDailyCount < MaxActive(unlockedSkillIds);
}
