using System.Text.Json;

namespace LifeRpg.Application.Dtos;

/// <summary>One offline-queued mutation. Mirrors (and supersets) the client's SyncAction union.</summary>
public record SyncOperation(
    string OpId,
    string Entity, // "hero" | "quest" | "journal"
    string Action, // "upsert" | "delete"
    JsonElement Payload);

public record SyncBatchRequest(DateTimeOffset? LastSyncedAt, List<SyncOperation> Operations);

public record SyncConflict(string OpId, string Reason);

/// <summary>Result of a sync batch. Idempotent: replays return the same applied set with no new writes.</summary>
public record SyncBatchResult(
    DateTimeOffset ServerTime,
    List<string> Applied,
    List<string> Skipped,
    List<SyncConflict> Conflicts,
    SyncServerChanges ServerChanges);

/// <summary>Delta pulled back to the client (everything changed since LastSyncedAt).</summary>
public record SyncServerChanges(
    HeroDto? Hero,
    List<QuestDto> Quests,
    List<JournalEntryDto> Journal);
