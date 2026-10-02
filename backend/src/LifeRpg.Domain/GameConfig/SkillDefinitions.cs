using LifeRpg.Domain.Enums;

namespace LifeRpg.Domain.GameConfig;

public sealed record SkillDefinition(
    string Id,
    string Name,
    string Description,
    SkillCategory Category,
    StatName? RequiredStat,
    int RequiredLevel,
    StatName? SecondaryStat,
    int? SecondaryLevel,
    string Icon,
    string Effect);

/// <summary>The skill catalog (36 skills). Faithful port of the client's skills.ts.</summary>
public static class SkillDefinitions
{
    private static SkillEffectDefinition.QuestXpBonus QuestXpBonus(
        int percent,
        IReadOnlyList<StatName>? stats = null,
        IReadOnlyList<QuestType>? questTypes = null,
        bool appliesToAllQuests = false) =>
        new(percent, stats, questTypes, appliesToAllQuests);

    private static SkillEffectDefinition.DifficultyUnlock DifficultyUnlock(
        QuestDifficulty difficulty,
        IReadOnlyList<StatName>? stats = null) =>
        new(difficulty, stats);

    private static SkillEffectDefinition.BossStepXp BossStepXp(int percent) => new(percent);

    private static SkillEffectDefinition.WeeklyCapacity WeeklyCapacity(int additionalSlots) =>
        new(additionalSlots);

    public static readonly IReadOnlyList<SkillDefinition> All = new[]
    {
        // Strength (5)
        new SkillDefinition("str-1", "Iron Grip", "Your dedication to physical training shows in every action.", SkillCategory.Strength, StatName.Strength, 3, null, null, "💪", "+5% XP on STR quests"),
        new SkillDefinition("str-2", "Titan's Resolve", "You push through barriers that would stop ordinary people.", SkillCategory.Strength, StatName.Strength, 7, null, null, "🏋️", "Unlock Hard difficulty for Strength quests"),
        new SkillDefinition("str-3", "Colossus", "Your physical prowess is legendary.", SkillCategory.Strength, StatName.Strength, 15, null, null, "⚔️", "+10% XP on all physical quests · Unlock Legendary Strength quests"),
        new SkillDefinition("str-4", "Mountain Breaker", "Even legendary burdens yield to your training.", SkillCategory.Strength, StatName.Strength, 25, null, null, "🏔️", "+8% XP on Boss quests · +10% XP on boss quests"),
        new SkillDefinition("str-5", "Worldshaper", "Your strength reshapes what a day can hold.", SkillCategory.Strength, StatName.Strength, 40, null, null, "🌍", "+12% XP on STR quests · +1 weekly contract quest slots"),
        // Vitality (5)
        new SkillDefinition("vit-1", "Second Wind", "Rest and recovery come naturally to you.", SkillCategory.Vitality, StatName.Vitality, 3, null, null, "🌿", "Rest days give +15 Vitality XP"),
        new SkillDefinition("vit-2", "Regeneration", "Your body recovers faster than most.", SkillCategory.Vitality, StatName.Vitality, 7, null, null, "💚", "Streak breaks lose only 50% multiplier · Unlock Hard Vitality quests"),
        new SkillDefinition("vit-3", "Undying", "Nothing can keep you down for long.", SkillCategory.Vitality, StatName.Vitality, 15, null, null, "❤️‍🔥", "+10% XP on all health quests · Unlock Legendary Vitality quests"),
        new SkillDefinition("vit-4", "Phoenix Recovery", "Rest days become true restoration rites.", SkillCategory.Vitality, StatName.Vitality, 25, null, null, "🕊️", "Rest days give +35 Vitality XP · Streak freeze: 1 free miss per week"),
        new SkillDefinition("vit-5", "Eternal Vessel", "Your recovery cadence carries the whole week.", SkillCategory.Vitality, StatName.Vitality, 40, null, null, "♾️", "+12% XP on VIT quests · +1 weekly contract quest slots"),
        // Intelligence (5)
        new SkillDefinition("int-1", "Quick Study", "You absorb knowledge faster than others.", SkillCategory.Intelligence, StatName.Intelligence, 3, null, null, "📖", "+5% XP on INT quests"),
        new SkillDefinition("int-2", "Polymath", "Your intellectual breadth is remarkable.", SkillCategory.Intelligence, StatName.Intelligence, 7, null, null, "🧠", "+10% XP on Side quests · Unlock Hard difficulty for Intelligence quests"),
        new SkillDefinition("int-3", "Sage Mind", "Wisdom beyond your years guides every decision.", SkillCategory.Intelligence, StatName.Intelligence, 15, null, null, "🔮", "+10% XP on all learning quests · Unlock Legendary Intelligence quests"),
        new SkillDefinition("int-4", "Archivist", "Boss campaigns yield deeper insight with each step.", SkillCategory.Intelligence, StatName.Intelligence, 25, null, null, "📚", "+15% XP on boss quests · +8% XP on Boss quests"),
        new SkillDefinition("int-5", "Oracle", "Your mind opens room for more weekly vows.", SkillCategory.Intelligence, StatName.Intelligence, 40, null, null, "👁️", "+12% XP on INT quests · +1 weekly contract quest slots"),
        // Charisma (5)
        new SkillDefinition("cha-1", "Silver Tongue", "Your words carry weight and charm.", SkillCategory.Charisma, StatName.Charisma, 3, null, null, "💬", "+5% XP on CHA quests"),
        new SkillDefinition("cha-2", "Natural Leader", "People naturally follow your example.", SkillCategory.Charisma, StatName.Charisma, 7, null, null, "👑", "+10% XP on Boss quests · Unlock Hard difficulty for Charisma quests"),
        new SkillDefinition("cha-3", "Legendary Presence", "Your reputation precedes you wherever you go.", SkillCategory.Charisma, StatName.Charisma, 15, null, null, "✨", "+10% XP on all social quests · Unlock Legendary Charisma quests"),
        new SkillDefinition("cha-4", "Rallying Cry", "Boss steps inspire extra growth for the party you lead.", SkillCategory.Charisma, StatName.Charisma, 25, null, null, "📣", "+10% XP on boss quests · +8% XP on Boss quests"),
        new SkillDefinition("cha-5", "Beacon", "Your presence expands what a week can hold.", SkillCategory.Charisma, StatName.Charisma, 40, null, null, "🗼", "+12% XP on CHA quests · +1 weekly contract quest slots"),
        // Dexterity (5)
        new SkillDefinition("dex-1", "Swift Hands", "You complete tasks with remarkable speed.", SkillCategory.Dexterity, StatName.Dexterity, 3, null, null, "⚡", "+5% XP on DEX quests"),
        new SkillDefinition("dex-2", "Multitasker", "Juggling multiple objectives is second nature.", SkillCategory.Dexterity, StatName.Dexterity, 7, null, null, "🎯", "Can have +2 active daily quests · Unlock Hard difficulty for Dexterity quests"),
        new SkillDefinition("dex-3", "Phantom Step", "Your efficiency is almost supernatural.", SkillCategory.Dexterity, StatName.Dexterity, 15, null, null, "💨", "+10% XP on all productivity quests · Unlock Legendary Dexterity quests"),
        new SkillDefinition("dex-4", "Clockwork", "Daily capacity expands as your craft sharpens.", SkillCategory.Dexterity, StatName.Dexterity, 25, null, null, "⚙️", "Can have +2 active daily quests · +8% XP on DEX quests"),
        new SkillDefinition("dex-5", "Warp Weaver", "You braid more vows into each week.", SkillCategory.Dexterity, StatName.Dexterity, 40, null, null, "🧵", "+12% XP on DEX quests · +1 weekly contract quest slots"),
        // Willpower (5)
        new SkillDefinition("wil-1", "Iron Will", "Discipline is your greatest weapon.", SkillCategory.Willpower, StatName.Willpower, 3, null, null, "🔥", "+5% XP on WIL quests"),
        new SkillDefinition("wil-2", "Unbreakable", "Your streak resilience is legendary.", SkillCategory.Willpower, StatName.Willpower, 7, null, null, "🛡️", "Streak freeze: 1 free miss per week · Unlock Hard difficulty for Willpower quests"),
        new SkillDefinition("wil-3", "Ascendant Will", "Your determination knows no bounds.", SkillCategory.Willpower, StatName.Willpower, 15, null, null, "⭐", "+10% XP on all discipline quests · Unlock Legendary Willpower quests"),
        new SkillDefinition("wil-4", "Stoic Anchor", "Misses barely dent the chain you forged.", SkillCategory.Willpower, StatName.Willpower, 25, null, null, "⚓", "Streak breaks keep 75% of your streak · Streak freeze: 2 free miss per week"),
        new SkillDefinition("wil-5", "Unyielding Crown", "Your discipline expands the week itself.", SkillCategory.Willpower, StatName.Willpower, 40, null, null, "👑", "+12% XP on WIL quests · +1 weekly contract quest slots"),
        // Cross-stat (6)
        new SkillDefinition("cross-1", "Battle Mage", "Strength of body and mind combined.", SkillCategory.Cross, StatName.Strength, 5, StatName.Intelligence, 5, "⚡🧠", "+5% XP on STR and INT quests"),
        new SkillDefinition("cross-2", "Warrior Poet", "Physical prowess meets artistic expression.", SkillCategory.Cross, StatName.Strength, 5, StatName.Charisma, 5, "⚔️✨", "+5% XP on STR and CHA quests"),
        new SkillDefinition("cross-3", "Mind Body", "Perfect harmony of physical and mental discipline.", SkillCategory.Cross, StatName.Vitality, 5, StatName.Willpower, 5, "🧘", "+5% XP on VIT and WIL quests"),
        new SkillDefinition("cross-4", "Tactician", "Speed meets strategy in perfect execution.", SkillCategory.Cross, StatName.Dexterity, 5, StatName.Intelligence, 5, "🎯📚", "+5% XP on DEX and INT quests"),
        new SkillDefinition("cross-5", "Diplomat", "Knowledge and charm make a powerful combination.", SkillCategory.Cross, StatName.Charisma, 5, StatName.Intelligence, 5, "🤝📖", "+5% XP on CHA and INT quests"),
        new SkillDefinition("cross-6", "Zen Master", "Ultimate balance of all aspects of life.", SkillCategory.Cross, StatName.Willpower, 10, StatName.Vitality, 10, "☯️", "+3% XP on ALL quests"),
    };

    private static readonly IReadOnlyDictionary<string, SkillDefinition> ById =
        All.ToDictionary(s => s.Id);

    private static readonly IReadOnlyDictionary<string, IReadOnlyList<SkillEffectDefinition>> EffectsById =
        new Dictionary<string, IReadOnlyList<SkillEffectDefinition>>
        {
            ["str-1"] = new SkillEffectDefinition[] { QuestXpBonus(5, new[] { StatName.Strength }) },
            ["str-2"] = new SkillEffectDefinition[] { DifficultyUnlock(QuestDifficulty.Hard, new[] { StatName.Strength }) },
            ["str-3"] = new SkillEffectDefinition[]
            {
                QuestXpBonus(10, new[] { StatName.Strength, StatName.Vitality, StatName.Dexterity }),
                DifficultyUnlock(QuestDifficulty.Legendary, new[] { StatName.Strength }),
            },
            ["str-4"] = new SkillEffectDefinition[]
            {
                QuestXpBonus(8, questTypes: new[] { QuestType.Boss }),
                BossStepXp(10),
            },
            ["str-5"] = new SkillEffectDefinition[]
            {
                QuestXpBonus(12, new[] { StatName.Strength }),
                WeeklyCapacity(1),
            },
            ["vit-1"] = new SkillEffectDefinition[] { new SkillEffectDefinition.RestDayXp(StatName.Vitality, 15) },
            ["vit-2"] = new SkillEffectDefinition[]
            {
                new SkillEffectDefinition.StreakRetention(50),
                DifficultyUnlock(QuestDifficulty.Hard, new[] { StatName.Vitality }),
            },
            ["vit-3"] = new SkillEffectDefinition[]
            {
                QuestXpBonus(10, new[] { StatName.Vitality }),
                DifficultyUnlock(QuestDifficulty.Legendary, new[] { StatName.Vitality }),
            },
            ["vit-4"] = new SkillEffectDefinition[]
            {
                new SkillEffectDefinition.RestDayXp(StatName.Vitality, 35),
                new SkillEffectDefinition.StreakFreeze(1),
            },
            ["vit-5"] = new SkillEffectDefinition[]
            {
                QuestXpBonus(12, new[] { StatName.Vitality }),
                WeeklyCapacity(1),
            },
            ["int-1"] = new SkillEffectDefinition[] { QuestXpBonus(5, new[] { StatName.Intelligence }) },
            ["int-2"] = new SkillEffectDefinition[]
            {
                QuestXpBonus(10, questTypes: new[] { QuestType.Side }),
                DifficultyUnlock(QuestDifficulty.Hard, new[] { StatName.Intelligence }),
            },
            ["int-3"] = new SkillEffectDefinition[]
            {
                QuestXpBonus(10, new[] { StatName.Intelligence }),
                DifficultyUnlock(QuestDifficulty.Legendary, new[] { StatName.Intelligence }),
            },
            ["int-4"] = new SkillEffectDefinition[]
            {
                BossStepXp(15),
                QuestXpBonus(8, questTypes: new[] { QuestType.Boss }),
            },
            ["int-5"] = new SkillEffectDefinition[]
            {
                QuestXpBonus(12, new[] { StatName.Intelligence }),
                WeeklyCapacity(1),
            },
            ["cha-1"] = new SkillEffectDefinition[] { QuestXpBonus(5, new[] { StatName.Charisma }) },
            ["cha-2"] = new SkillEffectDefinition[]
            {
                QuestXpBonus(10, questTypes: new[] { QuestType.Boss }),
                DifficultyUnlock(QuestDifficulty.Hard, new[] { StatName.Charisma }),
            },
            ["cha-3"] = new SkillEffectDefinition[]
            {
                QuestXpBonus(10, new[] { StatName.Charisma }),
                DifficultyUnlock(QuestDifficulty.Legendary, new[] { StatName.Charisma }),
            },
            ["cha-4"] = new SkillEffectDefinition[]
            {
                BossStepXp(10),
                QuestXpBonus(8, questTypes: new[] { QuestType.Boss }),
            },
            ["cha-5"] = new SkillEffectDefinition[]
            {
                QuestXpBonus(12, new[] { StatName.Charisma }),
                WeeklyCapacity(1),
            },
            ["dex-1"] = new SkillEffectDefinition[] { QuestXpBonus(5, new[] { StatName.Dexterity }) },
            ["dex-2"] = new SkillEffectDefinition[]
            {
                new SkillEffectDefinition.ActiveDailyQuestCapacity(2),
                DifficultyUnlock(QuestDifficulty.Hard, new[] { StatName.Dexterity }),
            },
            ["dex-3"] = new SkillEffectDefinition[]
            {
                QuestXpBonus(10, new[] { StatName.Dexterity }),
                DifficultyUnlock(QuestDifficulty.Legendary, new[] { StatName.Dexterity }),
            },
            ["dex-4"] = new SkillEffectDefinition[]
            {
                new SkillEffectDefinition.ActiveDailyQuestCapacity(2),
                QuestXpBonus(8, new[] { StatName.Dexterity }),
            },
            ["dex-5"] = new SkillEffectDefinition[]
            {
                QuestXpBonus(12, new[] { StatName.Dexterity }),
                WeeklyCapacity(1),
            },
            ["wil-1"] = new SkillEffectDefinition[] { QuestXpBonus(5, new[] { StatName.Willpower }) },
            ["wil-2"] = new SkillEffectDefinition[]
            {
                new SkillEffectDefinition.StreakFreeze(1),
                DifficultyUnlock(QuestDifficulty.Hard, new[] { StatName.Willpower }),
            },
            ["wil-3"] = new SkillEffectDefinition[]
            {
                QuestXpBonus(10, new[] { StatName.Willpower }),
                DifficultyUnlock(QuestDifficulty.Legendary, new[] { StatName.Willpower }),
            },
            ["wil-4"] = new SkillEffectDefinition[]
            {
                new SkillEffectDefinition.StreakRetention(75),
                new SkillEffectDefinition.StreakFreeze(2),
            },
            ["wil-5"] = new SkillEffectDefinition[]
            {
                QuestXpBonus(12, new[] { StatName.Willpower }),
                WeeklyCapacity(1),
            },
            ["cross-1"] = new SkillEffectDefinition[] { QuestXpBonus(5, new[] { StatName.Strength, StatName.Intelligence }) },
            ["cross-2"] = new SkillEffectDefinition[] { QuestXpBonus(5, new[] { StatName.Strength, StatName.Charisma }) },
            ["cross-3"] = new SkillEffectDefinition[] { QuestXpBonus(5, new[] { StatName.Vitality, StatName.Willpower }) },
            ["cross-4"] = new SkillEffectDefinition[] { QuestXpBonus(5, new[] { StatName.Dexterity, StatName.Intelligence }) },
            ["cross-5"] = new SkillEffectDefinition[] { QuestXpBonus(5, new[] { StatName.Charisma, StatName.Intelligence }) },
            ["cross-6"] = new SkillEffectDefinition[] { QuestXpBonus(3, appliesToAllQuests: true) },
        };

    public static SkillDefinition? GetById(string id) => ById.GetValueOrDefault(id);

    public static IReadOnlyList<SkillEffectDefinition> GetEffects(string id) =>
        EffectsById.GetValueOrDefault(id) ?? Array.Empty<SkillEffectDefinition>();
}
