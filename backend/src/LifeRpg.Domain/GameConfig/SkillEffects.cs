using LifeRpg.Domain.Enums;

namespace LifeRpg.Domain.GameConfig;

public abstract record SkillEffectDefinition
{
    private SkillEffectDefinition() { }

    public sealed record DisplayText(string Text) : SkillEffectDefinition;

    public sealed record QuestXpBonus(
        int Percent,
        IReadOnlyList<StatName>? Stats = null,
        IReadOnlyList<QuestType>? QuestTypes = null,
        bool AppliesToAllQuests = false) : SkillEffectDefinition;

    public sealed record RestDayXp(StatName Stat, int Amount) : SkillEffectDefinition;

    public sealed record StreakRetention(int RetentionPercent) : SkillEffectDefinition;

    public sealed record StreakFreeze(int MissesPerWeek) : SkillEffectDefinition;

    public sealed record ActiveDailyQuestCapacity(int AdditionalSlots) : SkillEffectDefinition;
}
