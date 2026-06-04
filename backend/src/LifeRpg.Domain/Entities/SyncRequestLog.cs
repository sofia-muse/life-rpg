using LifeRpg.Domain.Common;

namespace LifeRpg.Domain.Entities;

/// <summary>
/// Records applied sync operations so replays are no-ops. Uniqueness on (UserId, OpId)
/// makes the batch-sync endpoint idempotent.
/// </summary>
public class SyncRequestLog : Entity
{
    public Guid UserId { get; set; }
    public string OpId { get; set; } = string.Empty;
    public DateTimeOffset AppliedAt { get; set; }
}
