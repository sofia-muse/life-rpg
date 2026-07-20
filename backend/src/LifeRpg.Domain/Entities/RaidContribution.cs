using LifeRpg.Domain.Common;

namespace LifeRpg.Domain.Entities;

/// <summary>
/// One logged contribution toward a raid goal. ClientId makes writes idempotent
/// (same offline retry / double-tap won't double-count).
/// </summary>
public class RaidContribution : Entity
{
    public Guid RaidId { get; set; }
    public Raid? Raid { get; set; }

    public Guid HeroId { get; set; }
    public Hero? Hero { get; set; }

    public int Amount { get; set; }
    public string? Note { get; set; }

    /// <summary>Client-generated idempotency key (Guid as string).</summary>
    public string ClientId { get; set; } = string.Empty;

    public DateOnly ContributionDate { get; set; }
}
