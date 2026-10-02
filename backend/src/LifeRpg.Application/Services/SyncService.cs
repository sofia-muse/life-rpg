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
    private const int BaseActiveDailyLimit = 3;
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
            .Include(h => h.Quests)
            .Include(h => h.UnlockedSkills)
            .Include(h => h.JournalEntries)
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
                ("journal", "upsert") => UpsertJournal(hero, op),
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
                IsActive = dto.IsActive && (dto.Type != QuestType.Daily || CanActivateDailyQuest(hero, null)),
                TotalSteps = dto.TotalSteps,
                CompletedSteps = null,
                EvolutionPathId = dto.EvolutionPathId,
                IsCompleted = false,
                CompletedAt = null,
                CreatedAt = dto.CreatedAt == default ? _clock.UtcNow : dto.CreatedAt,
                UpdatedAt = dto.UpdatedAt == default ? _clock.UtcNow : dto.UpdatedAt,
            });
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
        existing.EvolutionPathId = dto.EvolutionPathId ?? existing.EvolutionPathId;
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

        // XP, the hero streak, and the freeze clock are computed on the server.
        // A later upsert must not replace them. Appearance, settings, and quest rows still sync.
        if (op.Payload.TryGetProperty("name", out var name) && name.ValueKind == JsonValueKind.String)
        {
            hero.Name = name.GetString()!.Trim();
        }
        if (op.Payload.TryGetProperty("restDaysUsed", out var restDaysUsed) && restDaysUsed.TryGetInt32(out var parsedRestDaysUsed))
        {
            hero.RestDaysUsed = parsedRestDaysUsed;
        }
        if (op.Payload.TryGetProperty("totalLoginDays", out var totalLoginDays) && totalLoginDays.TryGetInt32(out var parsedTotalLoginDays))
        {
            hero.TotalLoginDays = parsedTotalLoginDays;
        }
        if (op.Payload.TryGetProperty("lastRewardDate", out var lastRewardDate)
            && lastRewardDate.ValueKind == JsonValueKind.String
            && DateOnly.TryParse(lastRewardDate.GetString(), out var parsedLastRewardDate))
        {
            hero.LastRewardDate = parsedLastRewardDate;
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
                var previous = hero.Settings;
                if (!settings.TryGetProperty("timeZone", out _) && !settings.TryGetProperty("TimeZone", out _))
                {
                    parsed.TimeZone = previous.TimeZone;
                }
                parsed.RecentRestDates = previous.RecentRestDates;
                parsed.WeeklyRewardWeekKey = previous.WeeklyRewardWeekKey;
                parsed.WeeklyRewardTitle = previous.WeeklyRewardTitle;
                parsed.WeeklyRewardBadge = previous.WeeklyRewardBadge;
                parsed.DailyXpDate = previous.DailyXpDate;
                parsed.DailyXpPayoutsUsed = previous.DailyXpPayoutsUsed;
                if (!settings.TryGetProperty("activeForgedSkillIds", out _) && !settings.TryGetProperty("ActiveForgedSkillIds", out _))
                {
                    parsed.ActiveForgedSkillIds = previous.ActiveForgedSkillIds;
                }
                if (!settings.TryGetProperty("bonusPayoutDate", out _) && !settings.TryGetProperty("BonusPayoutDate", out _))
                {
                    parsed.BonusPayoutDate = previous.BonusPayoutDate;
                    parsed.BonusPayoutsUsed = previous.BonusPayoutsUsed;
                    parsed.OpenBossPayoutIds = previous.OpenBossPayoutIds;
                }
                else if (!settings.TryGetProperty("openBossPayoutIds", out _) && !settings.TryGetProperty("OpenBossPayoutIds", out _))
                {
                    parsed.OpenBossPayoutIds = previous.OpenBossPayoutIds;
                }
                hero.Settings = parsed;
            }
        }
        if (op.Payload.TryGetProperty("timeZone", out var timeZone) && timeZone.ValueKind == JsonValueKind.String)
        {
            hero.Settings.TimeZone = timeZone.GetString();
        }
        if (op.Payload.TryGetProperty("updatedAt", out updatedAtProp)
            && updatedAtProp.ValueKind == JsonValueKind.String
            && updatedAtProp.TryGetDateTimeOffset(out updatedAt))
        {
            hero.UpdatedAt = updatedAt;
        }
        return null;
    }

    private SyncConflict? UpsertJournal(Hero hero, SyncOperation op)
    {
        var dto = op.Payload.Deserialize<JournalEntryDto>(Json);
        if (dto is null)
        {
            return new SyncConflict(op.OpId, "Empty journal payload");
        }

        DateTimeOffset? payloadUpdatedAt = null;
        if (op.Payload.TryGetProperty("updatedAt", out var updatedAtProp)
            && updatedAtProp.ValueKind == JsonValueKind.String
            && updatedAtProp.TryGetDateTimeOffset(out var parsedUpdatedAt))
        {
            payloadUpdatedAt = parsedUpdatedAt;
        }

        var existing = hero.JournalEntries.FirstOrDefault(j => j.Id == dto.Id)
            ?? hero.JournalEntries.FirstOrDefault(j => j.Date == dto.Date);

        if (existing is null)
        {
            _db.JournalEntries.Add(new JournalEntry
            {
                Id = dto.Id == Guid.Empty ? Guid.NewGuid() : dto.Id,
                HeroId = hero.Id,
                Date = dto.Date,
                Narrative = dto.Narrative ?? string.Empty,
                QuestsCompleted = dto.QuestsCompleted,
                SkillsUnlocked = dto.SkillsUnlocked,
                XpGained = dto.XpGained ?? new Domain.ValueObjects.StatBlock(0),
                LevelsGained = dto.LevelsGained ?? new List<string>(),
                Milestones = dto.Milestones ?? new List<string>(),
                CreatedAt = payloadUpdatedAt ?? _clock.UtcNow,
                UpdatedAt = payloadUpdatedAt ?? _clock.UtcNow,
            });
            return null;
        }

        if (payloadUpdatedAt is { } updatedAt && updatedAt <= existing.UpdatedAt)
        {
            return new SyncConflict(op.OpId, "Stale journal payload");
        }

        existing.Date = dto.Date;
        existing.Narrative = dto.Narrative ?? string.Empty;
        existing.QuestsCompleted = dto.QuestsCompleted;
        existing.SkillsUnlocked = dto.SkillsUnlocked;
        if (dto.XpGained is not null)
        {
            existing.XpGained = dto.XpGained;
        }
        existing.LevelsGained = dto.LevelsGained ?? existing.LevelsGained;
        existing.Milestones = dto.Milestones ?? existing.Milestones;
        existing.UpdatedAt = payloadUpdatedAt ?? _clock.UtcNow;
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

    private bool CanActivateDailyQuest(Hero hero, Guid? currentQuestId)
    {
        var currentActiveDailyCount = hero.Quests.Count(
            q => q.Type == QuestType.Daily
                && q.IsActive
                && (!currentQuestId.HasValue || q.Id != currentQuestId.Value));
        var maxActiveDailyCount =
            BaseActiveDailyLimit + SkillResolver.GetActiveDailyQuestCapacityBonus(hero.UnlockedSkills.Select(s => s.SkillId));
        return currentActiveDailyCount < maxActiveDailyCount;
    }
}
