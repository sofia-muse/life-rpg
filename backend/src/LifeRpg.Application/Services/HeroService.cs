using LifeRpg.Application.Common;
using LifeRpg.Application.Dtos;
using LifeRpg.Domain.Entities;
using LifeRpg.Domain.Enums;
using LifeRpg.Domain.GameConfig;
using LifeRpg.Domain.GameEngine;
using LifeRpg.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;

namespace LifeRpg.Application.Services;

public class HeroService
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _user;
    private readonly IClock _clock;

    public HeroService(IAppDbContext db, ICurrentUser user, IClock clock)
    {
        _db = db;
        _user = user;
        _clock = clock;
    }

    public async Task<Result<HeroDto>> GetMineAsync(CancellationToken ct = default)
    {
        var hero = await LoadAsync(ct);
        return hero is null ? Result<HeroDto>.NotFound("Hero not found") : Result<HeroDto>.Success(hero.ToDto());
    }

    public async Task<Result<HeroDto>> CreateAsync(CreateHeroRequest req, CancellationToken ct = default)
    {
        if (_user.UserId is not { } userId)
        {
            return Result<HeroDto>.Unauthorized();
        }

        if (await _db.Heroes.AnyAsync(h => h.UserId == userId, ct))
        {
            return Result<HeroDto>.Conflict("Hero already exists for this user");
        }

        if (string.IsNullOrWhiteSpace(req.Name))
        {
            return Result<HeroDto>.Validation("Name is required");
        }

        var hero = new Hero
        {
            UserId = userId,
            Name = req.Name.Trim(),
            AvatarSeed = string.IsNullOrWhiteSpace(req.AvatarSeed) ? req.Name.Trim() : req.AvatarSeed,
            StatXp = new StatBlock(0),
            CharacterAppearance = req.CharacterAppearance ?? new CharacterAppearance(),
        };

        // Seed each focus stat with 50 XP (matches the client's createHero).
        foreach (var stat in req.FocusStats.Distinct())
        {
            hero.StatXp[stat] = 50;
        }

        RecomputeProgression(hero);
        // LastActiveDate stays null so the first quest completion starts the streak at 1.

        _db.Heroes.Add(hero);
        await _db.SaveChangesAsync(ct);
        return Result<HeroDto>.Success(hero.ToDto());
    }

    public async Task<Result<HeroDto>> UpdateAppearanceAsync(UpdateAppearanceRequest req, CancellationToken ct = default)
    {
        var hero = await LoadAsync(ct);
        if (hero is null)
        {
            return Result<HeroDto>.NotFound("Hero not found");
        }

        if (req.Appearance is not null)
        {
            hero.Appearance = req.Appearance;
        }
        if (req.CharacterAppearance is not null)
        {
            hero.CharacterAppearance = req.CharacterAppearance;
        }

        await _db.SaveChangesAsync(ct);
        return Result<HeroDto>.Success(hero.ToDto());
    }

    public async Task<Result> DeleteAsync(CancellationToken ct = default)
    {
        var hero = await LoadAsync(ct);
        if (hero is null)
        {
            return Result.NotFound("Hero not found");
        }

        _db.Heroes.Remove(hero);
        await _db.SaveChangesAsync(ct);
        return Result.Success();
    }

    public async Task<Result<List<StatProgressDto>>> GetStatsAsync(CancellationToken ct = default)
    {
        var hero = await LoadAsync(ct);
        if (hero is null)
        {
            return Result<List<StatProgressDto>>.NotFound("Hero not found");
        }

        var list = Stats.All.Select(stat =>
        {
            var xp = hero.StatXp[stat];
            var (currentXp, xpNeeded, progress) = XpTable.XpProgressInLevel(xp);
            return new StatProgressDto(stat, XpTable.LevelFromXp(xp), currentXp, xpNeeded, progress);
        }).ToList();

        return Result<List<StatProgressDto>>.Success(list);
    }

    private Task<Hero?> LoadAsync(CancellationToken ct) =>
        _user.UserId is { } userId
            ? _db.Heroes
                .Include(h => h.UnlockedSkills)
                .FirstOrDefaultAsync(h => h.UserId == userId, ct)
            : Task.FromResult<Hero?>(null);

    /// <summary>Recomputes derived progression (levels, hero level, dominant stat, class) from stat XP.</summary>
    internal static void RecomputeProgression(Hero hero)
    {
        hero.Stats = StatCalculator.GetStatBlock(hero.StatXp);
        hero.HeroLevel = StatCalculator.CalculateHeroLevel(hero.StatXp);
        hero.DominantStat = StatCalculator.GetDominantStat(hero.StatXp);
        hero.ClassTier = ClassDefinitions.GetTierForLevel(hero.HeroLevel);
        hero.ClassName = ClassDefinitions.GetClassName(hero.DominantStat, hero.ClassTier);
    }
}
