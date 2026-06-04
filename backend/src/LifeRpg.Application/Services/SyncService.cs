using System.Text.Json;
using LifeRpg.Application.Common;
using LifeRpg.Application.Dtos;
using LifeRpg.Domain.Entities;
using LifeRpg.Domain.Enums;
using LifeRpg.Domain.GameConfig;
using Microsoft.EntityFrameworkCore;

namespace LifeRpg.Application.Services;

/// <summary>
/// Idempotent batch sync. Each operation carries an opId logged in SyncRequestLogs, so replaying
/// a batch (e.g. after a flaky connection) is a no-op. Storage mutations use last-write-wins by
/// UpdatedAt; quest *completion* is intentionally handled by the authoritative /complete endpoint,
/// not here, so progression is always server-computed. Returns a delta of server changes to converge.
/// </summary>
public class SyncService
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter(JsonNamingPolicy.CamelCase) },
    };

    private readonly IAppDbContext _db;
    private readonly ICurrentUser _user;
    private readonly IClock _clock;

    public SyncService(IAppDbContext db, ICurrentUser user, IClock clock)
    {
        _db = db;
        _user = user;
        _clock = clock;
    }

    public async Task<Result<SyncBatchResult>> SyncAsync(SyncBatchRequest req, CancellationToken ct = default)
    {
        if (_user.UserId is not { } userId)
        {
            return Result<SyncBatchResult>.Unauthorized();
        }

        var hero = await _db.Heroes.Include(h => h.Quests)
            .FirstOrDefaultAsync(h => h.UserId == userId, ct);
        if (hero is null)
        {
            return Result<SyncBatchResult>.NotFound("Hero not found");
        }

        var applied = new List<string>();
        var skipped = new List<string>();
        var conflicts = new List<SyncConflict>();

        var alreadyApplied = await _db.SyncRequestLogs
            .Where(l => l.UserId == userId)
            .Select(l => l.OpId)
            .ToListAsync(ct);
        var appliedSet = alreadyApplied.ToHashSet();

        foreach (var op in req.Operations)
        {
            if (appliedSet.Contains(op.OpId))
            {
                skipped.Add(op.OpId); // Idempotent replay.
                continue;
            }

            var outcome = ApplyOperation(hero, op);
            if (outcome is { } conflict)
            {
                conflicts.Add(conflict);
                continue;
            }

            _db.SyncRequestLogs.Add(new SyncRequestLog
            {
                UserId = userId,
                OpId = op.OpId,
                AppliedAt = _clock.UtcNow,
            });
            appliedSet.Add(op.OpId);
            applied.Add(op.OpId);
        }

        await _db.SaveChangesAsync(ct);

        var changes = await BuildServerChangesAsync(hero, req.LastSyncedAt, ct);
        return Result<SyncBatchResult>.Success(
            new SyncBatchResult(_clock.UtcNow, applied, skipped, conflicts, changes));
    }

    /// <summary>Returns a conflict to skip the op, or null on success.</summary>
    private SyncConflict? ApplyOperation(Hero hero, SyncOperation op)
    {
        try
        {
            return (op.Entity, op.Action) switch
            {
                ("quest", "upsert") => UpsertQuest(hero, op),
                ("quest", "delete") => DeleteQuest(hero, op),
                ("hero", "upsert") => UpsertHero(hero, op),
                _ => new SyncConflict(op.OpId, $"Unsupported operation {op.Entity}/{op.Action}"),
            };
        }
        catch (JsonException)
        {
            return new SyncConflict(op.OpId, "Malformed payload");
        }
    }

    private SyncConflict? UpsertQuest(Hero hero, SyncOperation op)
    {
        var dto = op.Payload.Deserialize<QuestDto>(Json);
        if (dto is null)
        {
            return new SyncConflict(op.OpId, "Empty quest payload");
        }

        var existing = hero.Quests.FirstOrDefault(q => q.Id == dto.Id);
        if (existing is null)
        {
            // DbSet.Add (not the navigation collection) forces Added state — EF would otherwise
            // infer Modified from the client-provided non-default Guid key.
            _db.Quests.Add(new Quest
            {
                Id = dto.Id == Guid.Empty ? Guid.NewGuid() : dto.Id,
                HeroId = hero.Id,
                Title = dto.Title,
                Description = dto.Description,
                Type = dto.Type,
                Difficulty = dto.Difficulty,
                Stat = dto.Stat,
                XpReward = DifficultyXp.For(dto.Difficulty), // server owns XP
                IsActive = dto.IsActive,
                TotalSteps = dto.TotalSteps,
                CompletedSteps = dto.CompletedSteps,
            });
            return null;
        }

        // Last-write-wins is implicit (client only enqueues its own latest state); copy editable fields.
        existing.Title = dto.Title;
        existing.Description = dto.Description;
        existing.Difficulty = dto.Difficulty;
        existing.Stat = dto.Stat;
        existing.IsActive = dto.IsActive;
        existing.XpReward = DifficultyXp.For(dto.Difficulty);
        return null;
    }

    private SyncConflict? DeleteQuest(Hero hero, SyncOperation op)
    {
        var id = op.Payload.TryGetProperty("id", out var idProp) ? idProp.GetGuid() : Guid.Empty;
        var quest = hero.Quests.FirstOrDefault(q => q.Id == id);
        if (quest is not null)
        {
            _db.Quests.Remove(quest);
        }
        return null; // Deleting an already-absent quest is a no-op (idempotent).
    }

    private SyncConflict? UpsertHero(Hero hero, SyncOperation op)
    {
        // Only non-progression fields are client-writable; XP/level/class are server-authoritative.
        if (op.Payload.TryGetProperty("name", out var name) && name.ValueKind == JsonValueKind.String)
        {
            hero.Name = name.GetString()!.Trim();
        }
        if (op.Payload.TryGetProperty("settings", out var settings))
        {
            var parsed = settings.Deserialize<Domain.ValueObjects.HeroSettings>(Json);
            if (parsed is not null)
            {
                hero.Settings = parsed;
            }
        }
        return null;
    }

    private async Task<SyncServerChanges> BuildServerChangesAsync(
        Hero hero, DateTimeOffset? since, CancellationToken ct)
    {
        var heroChanged = since is null || hero.UpdatedAt > since;

        var quests = await _db.Quests
            .Where(q => q.HeroId == hero.Id && (since == null || q.UpdatedAt > since))
            .ToListAsync(ct);

        var journal = await _db.JournalEntries
            .Where(j => j.HeroId == hero.Id && (since == null || j.UpdatedAt > since))
            .ToListAsync(ct);

        return new SyncServerChanges(
            heroChanged ? hero.ToDto() : null,
            quests.Select(q => q.ToDto()).ToList(),
            journal.Select(j => j.ToDto()).ToList());
    }
}
