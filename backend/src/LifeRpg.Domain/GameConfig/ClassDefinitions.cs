using LifeRpg.Domain.Enums;

namespace LifeRpg.Domain.GameConfig;

public sealed record ClassDefinition(
    int Tier,
    string Name,
    StatName DominantStat,
    int RequiredLevel,
    string Title,
    string Description);

/// <summary>Class names by dominant stat and tier. Faithful port of the client's classes.ts.</summary>
public static class ClassDefinitions
{
    private sealed record ClassInfo(string Name, string Title, string Description);

    private static readonly IReadOnlyDictionary<int, int> TierLevels = new Dictionary<int, int>
    {
        [1] = 1,
        [2] = 5,
        [3] = 15,
        [4] = 30,
        [5] = 50,
    };

    private static readonly IReadOnlyDictionary<StatName, IReadOnlyDictionary<int, ClassInfo>> Map =
        new Dictionary<StatName, IReadOnlyDictionary<int, ClassInfo>>
        {
            [StatName.Strength] = new Dictionary<int, ClassInfo>
            {
                [1] = new("Apprentice", "Apprentice Warrior", "A fledgling fighter beginning their journey."),
                [2] = new("Warrior", "Warrior", "A seasoned fighter who has proven their mettle."),
                [3] = new("Champion", "Champion of Iron", "A formidable champion whose strength is renowned."),
                [4] = new("Warlord", "Warlord", "A legendary warrior who commands respect through sheer power."),
                [5] = new("Titan", "Titan of Legends", "An unstoppable force of nature."),
            },
            [StatName.Vitality] = new Dictionary<int, ClassInfo>
            {
                [1] = new("Apprentice", "Apprentice Healer", "A budding healer learning the ways of wellness."),
                [2] = new("Druid", "Druid", "A guardian of health and natural balance."),
                [3] = new("Sage Healer", "Sage Healer", "A wise healer whose vitality inspires others."),
                [4] = new("Archdruid", "Archdruid", "Master of life force and restoration."),
                [5] = new("Immortal", "The Immortal", "Transcendent vitality beyond mortal limits."),
            },
            [StatName.Intelligence] = new Dictionary<int, ClassInfo>
            {
                [1] = new("Apprentice", "Apprentice Scholar", "A curious mind seeking knowledge."),
                [2] = new("Scholar", "Scholar", "A dedicated student who has mastered the basics."),
                [3] = new("Archmage", "Archmage", "A brilliant mind whose knowledge runs deep."),
                [4] = new("Sage", "Grand Sage", "A font of wisdom respected by all."),
                [5] = new("Oracle", "The Oracle", "Omniscient understanding of all disciplines."),
            },
            [StatName.Charisma] = new Dictionary<int, ClassInfo>
            {
                [1] = new("Apprentice", "Apprentice Bard", "A charming newcomer finding their voice."),
                [2] = new("Bard", "Bard", "A charismatic storyteller who wins hearts."),
                [3] = new("Enchanter", "Enchanter", "A magnetic presence that draws people in."),
                [4] = new("Sovereign", "Sovereign", "A natural ruler whose charisma is legendary."),
                [5] = new("Paragon", "The Paragon", "Embodiment of leadership and inspiration."),
            },
            [StatName.Dexterity] = new Dictionary<int, ClassInfo>
            {
                [1] = new("Apprentice", "Apprentice Rogue", "A nimble beginner honing their reflexes."),
                [2] = new("Rogue", "Rogue", "A swift operative who gets things done."),
                [3] = new("Assassin", "Shadow Assassin", "A master of speed and precision."),
                [4] = new("Phantom", "Phantom", "Moving with supernatural efficiency."),
                [5] = new("Chronos", "Chronos", "Time itself bends to your productivity."),
            },
            [StatName.Willpower] = new Dictionary<int, ClassInfo>
            {
                [1] = new("Apprentice", "Apprentice Monk", "A disciplined soul beginning their training."),
                [2] = new("Monk", "Monk", "A disciplined practitioner of iron will."),
                [3] = new("Paladin", "Paladin", "An unbreakable champion of discipline."),
                [4] = new("Ascendant", "Ascendant", "Transcending ordinary willpower."),
                [5] = new("Transcendent", "The Transcendent", "Will beyond mortal comprehension."),
            },
        };

    /// <summary>Tier (1-5) for a hero level. Mirrors getTierForLevel.</summary>
    public static int GetTierForLevel(int heroLevel) => heroLevel switch
    {
        >= 50 => 5,
        >= 30 => 4,
        >= 15 => 3,
        >= 5 => 2,
        _ => 1,
    };

    public static string GetClassName(StatName dominantStat, int tier) => Map[dominantStat][tier].Title;

    public static ClassDefinition GetClassDefinition(StatName dominantStat, int tier)
    {
        var info = Map[dominantStat][tier];
        return new ClassDefinition(tier, info.Name, dominantStat, TierLevels[tier], info.Title, info.Description);
    }
}
