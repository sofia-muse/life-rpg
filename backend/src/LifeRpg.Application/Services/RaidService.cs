using LifeRpg.Application.Common;
using LifeRpg.Application.Dtos;
using LifeRpg.Domain.Entities;
using LifeRpg.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LifeRpg.Application.Services;

public class RaidService
{
    public const int DefaultMaxMembers = 8;
    public const int AbsoluteMaxMembers = 12;
    public const int MinTargetAmount = 10;
    public const int MaxTargetAmount = 100_000;
    public const int MaxSingleContribution = 500;
    public const int MaxDailyContributionPerHero = 1_000;

    private static readonly string[] InviteAdjectives =
    [
        "IRON", "GOLD", "MYTH", "BOLD", "FIRE", "STORM", "OATH", "VIGOR", "FOCUS", "WARD",
    ];

    private readonly IAppDbContext _db;
    private readonly ICurrentUser _user;
    private readonly IClock _clock;

    public RaidService(IAppDbContext db, ICurrentUser user, IClock clock)
    {
        _db = db;
        _user = user;
        _clock = clock;
    }

    public async Task<Result<List<RaidDto>>> ListMineAsync(CancellationToken ct = default)
    {
        var hero = await HeroAsync(ct);
        if (hero is null)
        {
            return Result<List<RaidDto>>.NotFound("Hero not found");
        }

        var raidIds = await _db.RaidMemberships
            .Where(m => m.HeroId == hero.Id)
            .Select(m => m.RaidId)
            .ToListAsync(ct);

        if (raidIds.Count == 0)
        {
            return Result<List<RaidDto>>.Success(new List<RaidDto>());
        }

        var raids = await LoadRaidsAsync(raidIds, ct);
        var dtos = raids
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => ToDto(r, hero.Id))
            .ToList();

        return Result<List<RaidDto>>.Success(dtos);
    }

    public async Task<Result<RaidDto>> GetAsync(Guid raidId, CancellationToken ct = default)
    {
        var hero = await HeroAsync(ct);
        if (hero is null)
        {
            return Result<RaidDto>.NotFound("Hero not found");
        }

        var raid = await LoadRaidAsync(raidId, ct);
        if (raid is null)
        {
            return Result<RaidDto>.NotFound("Raid not found");
        }

        if (raid.Members.All(m => m.HeroId != hero.Id))
        {
            return Result<RaidDto>.Failure(ErrorType.Forbidden, "You are not a member of this raid");
        }

        return Result<RaidDto>.Success(ToDto(raid, hero.Id));
    }

    public async Task<Result<RaidDto>> CreateAsync(CreateRaidRequest req, CancellationToken ct = default)
    {
        var hero = await HeroAsync(ct);
        if (hero is null)
        {
            return Result<RaidDto>.NotFound("Hero not found");
        }

        if (string.IsNullOrWhiteSpace(req.Title))
        {
            return Result<RaidDto>.Validation("Title is required");
        }

        if (string.IsNullOrWhiteSpace(req.UnitLabel))
        {
            return Result<RaidDto>.Validation("Unit label is required (e.g. push-ups)");
        }

        if (req.TargetAmount < MinTargetAmount || req.TargetAmount > MaxTargetAmount)
        {
            return Result<RaidDto>.Validation($"Target must be between {MinTargetAmount} and {MaxTargetAmount}");
        }

        var maxMembers = Math.Clamp(req.MaxMembers ?? DefaultMaxMembers, 2, AbsoluteMaxMembers);
        var inviteCode = await GenerateUniqueInviteCodeAsync(ct);
        var now = _clock.UtcNow;

        var raid = new Raid
        {
            LeaderHeroId = hero.Id,
            Title = req.Title.Trim(),
            Description = req.Description?.Trim() ?? string.Empty,
            SagaTitle = string.IsNullOrWhiteSpace(req.SagaTitle)
                ? $"{req.Title.Trim()} Campaign"
                : req.SagaTitle.Trim(),
            RewardTitle = string.IsNullOrWhiteSpace(req.RewardTitle)
                ? "Raid Victor"
                : req.RewardTitle.Trim(),
            UnitLabel = req.UnitLabel.Trim(),
            TargetAmount = req.TargetAmount,
            Stat = req.Stat,
            InviteCode = inviteCode,
            MaxMembers = maxMembers,
            Deadline = req.Deadline,
        };

        raid.Members.Add(new RaidMembership
        {
            HeroId = hero.Id,
            Role = RaidMemberRole.Leader,
            JoinedAt = now,
        });

        _db.Raids.Add(raid);
        await _db.SaveChangesAsync(ct);

        var loaded = await LoadRaidAsync(raid.Id, ct);
        return Result<RaidDto>.Success(ToDto(loaded!, hero.Id));
    }

    public async Task<Result<RaidDto>> JoinAsync(JoinRaidRequest req, CancellationToken ct = default)
    {
        var hero = await HeroAsync(ct);
        if (hero is null)
        {
            return Result<RaidDto>.NotFound("Hero not found");
        }

        var code = NormalizeInviteCode(req.InviteCode);
        if (string.IsNullOrWhiteSpace(code))
        {
            return Result<RaidDto>.Validation("Invite code is required");
        }

        var raid = await _db.Raids
            .Include(r => r.Members)
            .FirstOrDefaultAsync(r => r.InviteCode == code, ct);

        if (raid is null)
        {
            return Result<RaidDto>.NotFound("No raid found for that invite code");
        }

        if (raid.IsCompleted)
        {
            return Result<RaidDto>.Conflict("This raid has already been completed");
        }

        if (raid.Deadline is { } deadline && deadline < _clock.Today)
        {
            return Result<RaidDto>.Conflict("This raid's deadline has passed");
        }

        if (raid.Members.Any(m => m.HeroId == hero.Id))
        {
            var existing = await LoadRaidAsync(raid.Id, ct);
            return Result<RaidDto>.Success(ToDto(existing!, hero.Id));
        }

        if (raid.Members.Count >= raid.MaxMembers)
        {
            return Result<RaidDto>.Conflict("This raid party is full");
        }

        _db.RaidMemberships.Add(new RaidMembership
        {
            RaidId = raid.Id,
            HeroId = hero.Id,
            Role = RaidMemberRole.Member,
            JoinedAt = _clock.UtcNow,
        });
        await _db.SaveChangesAsync(ct);

        var loaded = await LoadRaidAsync(raid.Id, ct);
        return Result<RaidDto>.Success(ToDto(loaded!, hero.Id));
    }

    public async Task<Result<ContributeRaidResult>> ContributeAsync(
        Guid raidId,
        ContributeRaidRequest req,
        CancellationToken ct = default)
    {
        var hero = await HeroAsync(ct);
        if (hero is null)
        {
            return Result<ContributeRaidResult>.NotFound("Hero not found");
        }

        if (string.IsNullOrWhiteSpace(req.ClientId))
        {
            return Result<ContributeRaidResult>.Validation("ClientId is required for idempotent contributions");
        }

        if (req.Amount <= 0)
        {
            return Result<ContributeRaidResult>.Validation("Amount must be positive");
        }

        if (req.Amount > MaxSingleContribution)
        {
            return Result<ContributeRaidResult>.Validation($"Single contribution cannot exceed {MaxSingleContribution}");
        }

        var raid = await LoadRaidAsync(raidId, ct);
        if (raid is null)
        {
            return Result<ContributeRaidResult>.NotFound("Raid not found");
        }

        if (raid.Members.All(m => m.HeroId != hero.Id))
        {
            return Result<ContributeRaidResult>.Failure(ErrorType.Forbidden, "You are not a member of this raid");
        }

        var clientId = req.ClientId.Trim();
        var existing = raid.Contributions.FirstOrDefault(c => c.ClientId == clientId);
        if (existing is not null)
        {
            // Idempotent replay — return current state without double-counting.
            return Result<ContributeRaidResult>.Success(new ContributeRaidResult(ToDto(raid, hero.Id), false));
        }

        if (raid.IsCompleted)
        {
            return Result<ContributeRaidResult>.Conflict("This raid has already been completed");
        }

        if (raid.Deadline is { } deadline && deadline < _clock.Today)
        {
            return Result<ContributeRaidResult>.Conflict("This raid's deadline has passed");
        }

        var today = _clock.Today;
        var contributions = UniqueContributions(raid.Contributions);
        var todayTotal = contributions
            .Where(c => c.HeroId == hero.Id && c.ContributionDate == today)
            .Sum(c => c.Amount);

        if (todayTotal + req.Amount > MaxDailyContributionPerHero)
        {
            return Result<ContributeRaidResult>.Validation(
                $"Daily contribution cap is {MaxDailyContributionPerHero} {raid.UnitLabel}");
        }

        var contribution = new RaidContribution
        {
            RaidId = raid.Id,
            HeroId = hero.Id,
            Amount = req.Amount,
            Note = string.IsNullOrWhiteSpace(req.Note) ? null : req.Note.Trim(),
            ClientId = clientId,
            ContributionDate = today,
        };

        _db.RaidContributions.Add(contribution);

        // Prefer a DB sum so Include cartesian products cannot over-count progress.
        var priorTotal = await _db.RaidContributions
            .Where(c => c.RaidId == raid.Id)
            .SumAsync(c => (int?)c.Amount, ct) ?? 0;
        var newTotal = priorTotal + req.Amount;
        var justCompleted = false;
        if (newTotal >= raid.TargetAmount)
        {
            raid.IsCompleted = true;
            raid.CompletedAt = _clock.UtcNow;
            justCompleted = true;
        }

        await _db.SaveChangesAsync(ct);

        var loaded = await LoadRaidAsync(raid.Id, ct);
        return Result<ContributeRaidResult>.Success(new ContributeRaidResult(ToDto(loaded!, hero.Id), justCompleted));
    }

    private async Task<Hero?> HeroAsync(CancellationToken ct)
    {
        if (_user.UserId is not { } userId)
        {
            return null;
        }

        return await _db.Heroes.FirstOrDefaultAsync(h => h.UserId == userId, ct);
    }

    private async Task<Raid?> LoadRaidAsync(Guid raidId, CancellationToken ct)
    {
        var raids = await LoadRaidsAsync(new[] { raidId }, ct);
        return raids.FirstOrDefault();
    }

    private async Task<List<Raid>> LoadRaidsAsync(IEnumerable<Guid> raidIds, CancellationToken ct)
    {
        var idList = raidIds.Distinct().ToList();
        return await _db.Raids
            .Include(r => r.Members).ThenInclude(m => m.Hero)
            .Include(r => r.Contributions).ThenInclude(c => c.Hero)
            .Include(r => r.LeaderHero)
            .Where(r => idList.Contains(r.Id))
            .ToListAsync(ct);
    }

    private async Task<string> GenerateUniqueInviteCodeAsync(CancellationToken ct)
    {
        for (var attempt = 0; attempt < 12; attempt++)
        {
            var adjective = InviteAdjectives[Random.Shared.Next(InviteAdjectives.Length)];
            var suffix = Random.Shared.Next(100, 999).ToString();
            var code = $"{adjective}-{suffix}";
            var exists = await _db.Raids.AnyAsync(r => r.InviteCode == code, ct);
            if (!exists)
            {
                return code;
            }
        }

        return $"RAID-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";
    }

    private static string NormalizeInviteCode(string? code) =>
        (code ?? string.Empty).Trim().ToUpperInvariant().Replace(' ', '-');

    /// <summary>
    /// Multi-collection Includes can duplicate related rows in memory; dedupe by PK before summing.
    /// </summary>
    private static List<RaidContribution> UniqueContributions(IEnumerable<RaidContribution> items) =>
        items.GroupBy(c => c.Id).Select(g => g.First()).ToList();

    private static List<RaidMembership> UniqueMembers(IEnumerable<RaidMembership> items) =>
        items.GroupBy(m => m.Id).Select(g => g.First()).ToList();

    private static RaidDto ToDto(Raid raid, Guid viewerHeroId)
    {
        var contributions = UniqueContributions(raid.Contributions);
        var membersList = UniqueMembers(raid.Members);
        var currentAmount = contributions.Sum(c => c.Amount);
        var yourContribution = contributions.Where(c => c.HeroId == viewerHeroId).Sum(c => c.Amount);

        var members = membersList
            .OrderBy(m => m.Role == RaidMemberRole.Leader ? 0 : 1)
            .ThenBy(m => m.JoinedAt)
            .Select(m => new RaidMemberDto(
                m.HeroId,
                m.Hero?.Name ?? "Unknown",
                m.Hero?.ClassName ?? "Adventurer",
                m.Role,
                contributions.Where(c => c.HeroId == m.HeroId).Sum(c => c.Amount),
                m.JoinedAt))
            .ToList();

        var recent = contributions
            .OrderByDescending(c => c.CreatedAt)
            .Take(20)
            .Select(c => new RaidContributionDto(
                c.Id,
                c.HeroId,
                c.Hero?.Name ?? "Unknown",
                c.Amount,
                c.Note,
                c.ContributionDate,
                c.CreatedAt))
            .ToList();

        return new RaidDto(
            raid.Id,
            raid.Title,
            raid.Description,
            raid.SagaTitle,
            raid.RewardTitle,
            raid.UnitLabel,
            raid.TargetAmount,
            currentAmount,
            raid.Stat,
            raid.InviteCode,
            raid.MaxMembers,
            membersList.Count,
            raid.Deadline,
            raid.IsCompleted,
            raid.CompletedAt,
            raid.CreatedAt,
            raid.LeaderHeroId,
            raid.LeaderHero?.Name ?? "Unknown",
            yourContribution,
            members,
            recent);
    }
}
