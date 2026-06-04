using LifeRpg.Domain.Common;
using LifeRpg.Domain.Enums;

namespace LifeRpg.Domain.Entities;

/// <summary>
/// Audit record of a single quest completion. Powers anti-cheat (one daily completion per
/// calendar day), the journal, and analytics.
/// </summary>
public class QuestCompletion : Entity
{
    public Guid HeroId { get; set; }
    public Hero? Hero { get; set; }

    public Guid QuestId { get; set; }
    public StatName Stat { get; set; }

    /// <summary>Calendar day of completion, used to enforce once-per-day for daily quests.</summary>
    public DateOnly CompletionDate { get; set; }

    public int XpAwarded { get; set; }
    public DateTimeOffset CompletedAt { get; set; }
}
