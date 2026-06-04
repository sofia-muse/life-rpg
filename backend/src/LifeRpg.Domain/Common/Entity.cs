namespace LifeRpg.Domain.Common;

/// <summary>Base for persisted aggregates. Guid PKs are client-generatable so offline-created
/// rows keep their identity through sync.</summary>
public abstract class Entity
{
    public Guid Id { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
