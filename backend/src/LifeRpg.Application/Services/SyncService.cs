using System.Text.Json;
using LifeRpg.Application.Common;
using LifeRpg.Application.Dtos;
using LifeRpg.Domain.Entities;
using LifeRpg.Domain.Enums;
using LifeRpg.Domain.GameConfig;
using LifeRpg.Domain.GameEngine;
using Microsoft.EntityFrameworkCore;

namespace LifeRpg.Application.Services;

/// <summary>
/// Idempotent batch sync. Each operation carries an opId logged in SyncRequestLogs, so replaying
/// a batch (e.g. after a flaky connection) is a no-op. Storage mutations accept only newer payloads
/// by UpdatedAt; quest *completion* is intentionally handled by the authoritative /complete endpoint,
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

        var hero = await _db.Heroes
            .Include(h => h.UnlockedSkills)
            .FirstOrDefaultAsync(h => h.UserId == userId, ct);
        if (hero is null)
        {
            return Result<SyncBatchResult>.NotFound("Hero not found");
        }

        await AttachQuestsForBatchAsync(hero, req.Operations, ct);

        var applied = new List<string>();
        var skipped = new List<string>();
        var conflicts = new List<SyncConflict>();

        var opIds = req.Operations.Select(o => o.OpId).ToList();
        var alreadyApplied = opIds.Count == 0
            ? new List<string>()
            : await _db.SyncRequestLogs
                .Where(l => l.UserId == userId && opIds.Contains(l.OpId))
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
            var created = new Quest
            {
                Id = dto.Id == Guid.Empty ? Guid.NewGuid() : dto.Id,
                HeroId = hero.Id,
                Title = dto.Title,
                Description = dto.Description,
                Type = dto.Type,
                Difficulty = dto.Difficulty,
                Stat = dto.Stat,
                XpReward = DifficultyXp.For(dto.Difficulty), // server owns XP
                IsActive = dto.IsActive && (dto.Type != QuestType.Daily || CanActivateDailyQuest(hero, null)),
                TotalSteps = dto.TotalSteps,
                CompletedSteps = dto.CompletedSteps,
                IsCompleted = dto.IsCompleted,
                CompletedAt = dto.CompletedAt,
                CreatedAt = dto.CreatedAt == default ? _clock.UtcNow : dto.CreatedAt,
                UpdatedAt = dto.UpdatedAt == default ? _clock.UtcNow : dto.UpdatedAt,
            };
            _db.Quests.Add(created);
            hero.Quests.Add(created);
            return null;
        }

        if (dto.UpdatedAt <= existing.UpdatedAt)
        {
            return new SyncConflict(op.OpId, "Stale quest payload");
        }

        existing.Title = dto.Title;
        existing.Description = dto.Description;
        existing.Type = dto.Type;
        existing.Difficulty = dto.Difficulty;
        existing.Stat = dto.Stat;
        existing.IsActive = dto.IsActive
            && (dto.Type != QuestType.Daily || CanActivateDailyQuest(hero, existing.Id));
        existing.TotalSteps = dto.TotalSteps;
        existing.CompletedSteps = dto.CompletedSteps;
        existing.XpReward = DifficultyXp.For(dto.Difficulty);
        existing.UpdatedAt = dto.UpdatedAt;
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
        if (op.Payload.TryGetProperty("updatedAt", out var updatedAtProp)
            && updatedAtProp.ValueKind == JsonValueKind.String
            && updatedAtProp.TryGetDateTimeOffset(out var updatedAt)
            && updatedAt <= hero.UpdatedAt)
        {
            return new SyncConflict(op.OpId, "Stale hero payload");
        }

        // Quest completion remains server-authoritative, but client-managed daily/recovery systems
        // still sync their derived hero fields back through this storage path.
        if (op.Payload.TryGetProperty("name", out var name) && name.ValueKind == JsonValueKind.String)
        {
            hero.Name = name.GetString()!.Trim();
        }
        if (op.Payload.TryGetProperty("statXP", out var statXp)
            || op.Payload.TryGetProperty("statXp", out statXp))
        {
            var parsed = statXp.Deserialize<Domain.ValueObjects.StatBlock>(Json);
            if (parsed is not null)
            {
                hero.StatXp = parsed;
                HeroService.RecomputeProgression(hero);
            }
        }
        if (op.Payload.TryGetProperty("currentStreak", out var currentStreak) && currentStreak.TryGetInt32(out var parsedCurrentStreak))
        {
            hero.CurrentStreak = parsedCurrentStreak;
        }
        if (op.Payload.TryGetProperty("longestStreak", out var longestStreak) && longestStreak.TryGetInt32(out var parsedLongestStreak))
        {
            hero.LongestStreak = parsedLongestStreak;
        }
        if (op.Payload.TryGetProperty("restDaysUsed", out var restDaysUsed) && restDaysUsed.TryGetInt32(out var parsedRestDaysUsed))
        {
            hero.RestDaysUsed = parsedRestDaysUsed;
        }
        if (op.Payload.TryGetProperty("totalLoginDays", out var totalLoginDays) && totalLoginDays.TryGetInt32(out var parsedTotalLoginDays))
        {
            hero.TotalLoginDays = parsedTotalLoginDays;
        }
        if (op.Payload.TryGetProperty("lastActiveDate", out var lastActiveDate)
            && lastActiveDate.ValueKind == JsonValueKind.String
            && DateOnly.TryParse(lastActiveDate.GetString(), out var parsedLastActiveDate))
        {
            hero.LastActiveDate = parsedLastActiveDate;
        }
        if (op.Payload.TryGetProperty("lastRewardDate", out var lastRewardDate)
            && lastRewardDate.ValueKind == JsonValueKind.String
            && DateOnly.TryParse(lastRewardDate.GetString(), out var parsedLastRewardDate))
        {
            hero.LastRewardDate = parsedLastRewardDate;
        }
        if (op.Payload.TryGetProperty("lastStreakFreezeDate", out var lastStreakFreezeDate)
            && lastStreakFreezeDate.ValueKind == JsonValueKind.String
            && DateOnly.TryParse(lastStreakFreezeDate.GetString(), out var parsedLastStreakFreezeDate))
        {
            hero.LastStreakFreezeDate = parsedLastStreakFreezeDate;
        }
        if (op.Payload.TryGetProperty("appearance", out var appearance))
        {
            var parsed = appearance.Deserialize<Domain.ValueObjects.HeroAppearance>(Json);
            if (parsed is not null)
            {
                hero.Appearance = parsed;
            }
        }
        if (op.Payload.TryGetProperty("characterAppearance", out var characterAppearance))
        {
            var parsed = characterAppearance.Deserialize<Domain.ValueObjects.CharacterAppearance>(Json);
            if (parsed is not null)
            {
                hero.CharacterAppearance = parsed;
            }
        }
        if (op.Payload.TryGetProperty("settings", out var settings))
        {
            var parsed = settings.Deserialize<Domain.ValueObjects.HeroSettings>(Json);
            if (parsed is not null)
            {
                hero.Settings = parsed;
            }
        }
        if (op.Payload.TryGetProperty("updatedAt", out updatedAtProp)
            && updatedAtProp.ValueKind == JsonValueKind.String
            && updatedAtProp.TryGetDateTimeOffset(out updatedAt))
        {
            hero.UpdatedAt = updatedAt;
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

    private async Task AttachQuestsForBatchAsync(Hero hero, IReadOnlyList<SyncOperation> operations, CancellationToken ct)
    {
        var touchedIds = new HashSet<Guid>();
        foreach (var op in operations)
        {
            if (op.Entity != "quest")
            {
                continue;
            }

            if (op.Action == "delete"
                && op.Payload.TryGetProperty("id", out var idProp)
                && idProp.TryGetGuid(out var deleteId))
            {
                touchedIds.Add(deleteId);
                continue;
            }

            if (op.Action == "upsert")
            {
                try
                {
                    var dto = op.Payload.Deserialize<QuestDto>(Json);
                    if (dto is not null && dto.Id != Guid.Empty)
                    {
                        touchedIds.Add(dto.Id);
                    }
                }
                catch (JsonException)
                {
                    // Malformed payloads are reported as conflicts during ApplyOperation.
                }
            }
        }

        var quests = await _db.Quests
            .Where(q => q.HeroId == hero.Id
                && (touchedIds.Contains(q.Id)
                    || (q.Type == QuestType.Daily && q.IsActive)))
            .ToListAsync(ct);

        foreach (var quest in quests)
        {
            hero.Quests.Add(quest);
        }
    }

    private bool CanActivateDailyQuest(Hero hero, Guid? currentQuestId)
    {
        var currentActiveDailyCount = hero.Quests.Count(
            q => q.Type == QuestType.Daily
                && q.IsActive
                && (!currentQuestId.HasValue || q.Id != currentQuestId.Value));
        return DailyQuestCapacity.CanActivate(
            currentActiveDailyCount,
            hero.UnlockedSkills.Select(s => s.SkillId));
    }
}
