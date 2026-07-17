using LifeRpg.Domain.Common;
using LifeRpg.Domain.Enums;

namespace LifeRpg.Domain.Entities;

/// <summary>
/// Cooperative party raid: a huge shared real-world goal (e.g. 500 push-ups).
/// Separate from solo <see cref="QuestType.Boss"/> quests.
/// </summary>
public class Raid : Entity
{
    public Guid LeaderHeroId { get; set; }
    public Hero? LeaderHero { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string SagaTitle { get; set; } = string.Empty;
    public string RewardTitle { get; set; } = string.Empty;

    /// <summary>Unit label shown in UI, e.g. "push-ups".</summary>
    public string UnitLabel { get; set; } = "reps";

    public int TargetAmount { get; set; }
    public StatName Stat { get; set; } = StatName.Strength;

    /// <summary>Short invite code, e.g. IRON-7K2.</summary>
    public string InviteCode { get; set; } = string.Empty;

    public int MaxMembers { get; set; } = 8;
    public DateOnly? Deadline { get; set; }

    public bool IsCompleted { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }

    public List<RaidMembership> Members { get; set; } = new();
    public List<RaidContribution> Contributions { get; set; } = new();
}
