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

/// <summary>The skill catalog (24 skills). Faithful port of the client's skills.ts.</summary>
public static class SkillDefinitions
{
    public static readonly IReadOnlyList<SkillDefinition> All = new[]
    {
        // Strength (3)
        new SkillDefinition("str-1", "Iron Grip", "Your dedication to physical training shows in every action.", SkillCategory.Strength, StatName.Strength, 3, null, null, "💪", "+5% XP on Strength quests"),
        new SkillDefinition("str-2", "Titan's Resolve", "You push through barriers that would stop ordinary people.", SkillCategory.Strength, StatName.Strength, 7, null, null, "🏋️", "Unlock Hard difficulty Strength quests"),
        new SkillDefinition("str-3", "Colossus", "Your physical prowess is legendary.", SkillCategory.Strength, StatName.Strength, 15, null, null, "⚔️", "+10% XP on all physical quests"),
        // Vitality (3)
        new SkillDefinition("vit-1", "Second Wind", "Rest and recovery come naturally to you.", SkillCategory.Vitality, StatName.Vitality, 3, null, null, "🌿", "Rest days give +15 Vitality XP"),
        new SkillDefinition("vit-2", "Regeneration", "Your body recovers faster than most.", SkillCategory.Vitality, StatName.Vitality, 7, null, null, "💚", "Streak breaks lose only 50% multiplier"),
        new SkillDefinition("vit-3", "Undying", "Nothing can keep you down for long.", SkillCategory.Vitality, StatName.Vitality, 15, null, null, "❤️‍🔥", "+10% XP on all health quests"),
        // Intelligence (3)
        new SkillDefinition("int-1", "Quick Study", "You absorb knowledge faster than others.", SkillCategory.Intelligence, StatName.Intelligence, 3, null, null, "📖", "+5% XP on Intelligence quests"),
        new SkillDefinition("int-2", "Polymath", "Your intellectual breadth is remarkable.", SkillCategory.Intelligence, StatName.Intelligence, 7, null, null, "🧠", "Side quests give +10% XP"),
        new SkillDefinition("int-3", "Sage Mind", "Wisdom beyond your years guides every decision.", SkillCategory.Intelligence, StatName.Intelligence, 15, null, null, "🔮", "+10% XP on all learning quests"),
        // Charisma (3)
        new SkillDefinition("cha-1", "Silver Tongue", "Your words carry weight and charm.", SkillCategory.Charisma, StatName.Charisma, 3, null, null, "💬", "+5% XP on Charisma quests"),
        new SkillDefinition("cha-2", "Natural Leader", "People naturally follow your example.", SkillCategory.Charisma, StatName.Charisma, 7, null, null, "👑", "Boss quests give +10% XP"),
        new SkillDefinition("cha-3", "Legendary Presence", "Your reputation precedes you wherever you go.", SkillCategory.Charisma, StatName.Charisma, 15, null, null, "✨", "+10% XP on all social quests"),
        // Dexterity (3)
        new SkillDefinition("dex-1", "Swift Hands", "You complete tasks with remarkable speed.", SkillCategory.Dexterity, StatName.Dexterity, 3, null, null, "⚡", "+5% XP on Dexterity quests"),
        new SkillDefinition("dex-2", "Multitasker", "Juggling multiple objectives is second nature.", SkillCategory.Dexterity, StatName.Dexterity, 7, null, null, "🎯", "Can have +2 active daily quests"),
        new SkillDefinition("dex-3", "Phantom Step", "Your efficiency is almost supernatural.", SkillCategory.Dexterity, StatName.Dexterity, 15, null, null, "💨", "+10% XP on all productivity quests"),
        // Willpower (3)
        new SkillDefinition("wil-1", "Iron Will", "Discipline is your greatest weapon.", SkillCategory.Willpower, StatName.Willpower, 3, null, null, "🔥", "+5% XP on Willpower quests"),
        new SkillDefinition("wil-2", "Unbreakable", "Your streak resilience is legendary.", SkillCategory.Willpower, StatName.Willpower, 7, null, null, "🛡️", "Streak freeze: 1 free miss per week"),
        new SkillDefinition("wil-3", "Ascendant Will", "Your determination knows no bounds.", SkillCategory.Willpower, StatName.Willpower, 15, null, null, "⭐", "+10% XP on all discipline quests"),
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

    public static SkillDefinition? GetById(string id) => ById.GetValueOrDefault(id);
}
