using LifeRpg.Domain.Common;
using LifeRpg.Domain.Enums;
using LifeRpg.Domain.ValueObjects;

namespace LifeRpg.Domain.Entities;

/// <summary>
/// The player's hero. One per user. Derived progression fields (level, class, streak) are
/// real columns for querying; complex value objects (stat XP, appearance) are JSON columns.
/// </summary>
public class Hero : Entity
{
    /// <summary>Owning account (Identity user id). No navigation to keep Domain free of Identity.</summary>
    public Guid UserId { get; set; }

    public string Name { get; set; } = string.Empty;
    public string AvatarSeed { get; set; } = string.Empty;

    // Progression (derived, recomputed server-side; stored for querying).
    public int HeroLevel { get; set; } = 1;
    public string ClassName { get; set; } = "Apprentice Warrior";
    public int ClassTier { get; set; } = 1;
    public StatName DominantStat { get; set; } = StatName.Strength;
    public int TotalQuestsCompleted { get; set; }

    // Streak.
    public int CurrentStreak { get; set; }
    public int LongestStreak { get; set; }
    public DateOnly? LastActiveDate { get; set; }
    public int RestDaysUsed { get; set; }

    // Daily reward.
    public DateOnly? LastRewardDate { get; set; }
    public int TotalLoginDays { get; set; }

    // Value objects (JSON columns).
    public StatBlock StatXp { get; set; } = new(0);
    public StatBlock Stats { get; set; } = new(0);
    public HeroAppearance Appearance { get; set; } = new();
    public CharacterAppearance CharacterAppearance { get; set; } = new();
    public HeroSettings Settings { get; set; } = new();

    // Optimistic concurrency for sync conflict detection.
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    // Navigations.
    public List<Quest> Quests { get; set; } = new();
    public List<UnlockedSkill> UnlockedSkills { get; set; } = new();
    public List<GeneratedSkill> GeneratedSkills { get; set; } = new();
    public List<JournalEntry> JournalEntries { get; set; } = new();
    public List<QuestCompletion> QuestCompletions { get; set; } = new();
}
