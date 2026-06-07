using LifeRpg.Application.Common;
using LifeRpg.Application.Dtos;
using LifeRpg.Domain.Entities;
using LifeRpg.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LifeRpg.Application.Services;

/// <summary>
/// Forges an AI-generated skill personalized to the hero. The LLM only supplies flavor + a target
/// stat + a suggested percent; this service is the trust boundary — it validates the stat, clamps
/// the percent, sanitizes text, and builds the canonical effect string so power can't be inflated.
/// </summary>
public class SkillForgeService
{
    public const int MaxForgedPerHero = 8;
    private const int MinPercent = 1;
    private const int MaxPercent = 10;

    private readonly IAppDbContext _db;
    private readonly ICurrentUser _user;
    private readonly IClock _clock;
    private readonly ILlmClient _llm;

    public SkillForgeService(IAppDbContext db, ICurrentUser user, IClock clock, ILlmClient llm)
    {
        _db = db;
        _user = user;
        _clock = clock;
        _llm = llm;
    }

    public async Task<Result<SkillDto>> ForgeAsync(CancellationToken ct = default)
    {
        if (_user.UserId is not { } userId)
        {
            return Result<SkillDto>.Unauthorized();
        }

        var hero = await _db.Heroes
            .Include(h => h.GeneratedSkills)
            .FirstOrDefaultAsync(h => h.UserId == userId, ct);
        if (hero is null)
        {
            return Result<SkillDto>.NotFound("Hero not found");
        }

        if (hero.GeneratedSkills.Count >= MaxForgedPerHero)
        {
            return Result<SkillDto>.Conflict(
                $"You've forged the maximum of {MaxForgedPerHero} skills.");
        }

        var prompt = new SkillForgePrompt(
            hero.Name,
            hero.ClassName,
            hero.DominantStat.ToString(),
            hero.HeroLevel,
            hero.GeneratedSkills.Select(s => s.Name).ToList());

        ForgedSkillDraft draft;
        try
        {
            draft = await _llm.ForgeSkillAsync(prompt, ct);
        }
        catch (Exception ex)
        {
            return Result<SkillDto>.Failure(ErrorType.Validation, $"Skill forge failed: {ex.Message}");
        }

        // ── Trust boundary: validate + clamp everything the model produced. ──
        var stat = Enum.TryParse<StatName>(draft.Stat, ignoreCase: true, out var parsed)
            ? parsed
            : hero.DominantStat;
        var percent = Math.Clamp(draft.BonusPercent, MinPercent, MaxPercent);
        var name = Truncate(string.IsNullOrWhiteSpace(draft.Name) ? "Forged Skill" : draft.Name.Trim(), 40);
        var description = Truncate(draft.Description?.Trim() ?? string.Empty, 160);
        var icon = SafeIcon(draft.Icon);

        var skill = new GeneratedSkill
        {
            Id = Guid.NewGuid(),
            HeroId = hero.Id,
            Name = name,
            Description = description,
            Icon = icon,
            Stat = stat,
            BonusPercent = percent,
            Effect = $"+{percent}% XP on {Capitalize(stat.ToString())} quests",
        };

        _db.GeneratedSkills.Add(skill);
        await _db.SaveChangesAsync(ct);

        return Result<SkillDto>.Success(skill.ToDto());
    }

    public async Task<Result<List<SkillDto>>> ListAsync(CancellationToken ct = default)
    {
        if (_user.UserId is not { } userId)
        {
            return Result<List<SkillDto>>.Unauthorized();
        }

        var hero = await _db.Heroes
            .Include(h => h.GeneratedSkills)
            .FirstOrDefaultAsync(h => h.UserId == userId, ct);
        if (hero is null)
        {
            return Result<List<SkillDto>>.NotFound("Hero not found");
        }

        return Result<List<SkillDto>>.Success(
            hero.GeneratedSkills.OrderByDescending(s => s.CreatedAt).Select(s => s.ToDto()).ToList());
    }

    private static string Truncate(string value, int max) =>
        value.Length <= max ? value : value[..max];

    private static string Capitalize(string s) =>
        string.IsNullOrEmpty(s) ? s : char.ToUpperInvariant(s[0]) + s[1..].ToLowerInvariant();

    private static string SafeIcon(string? icon)
    {
        var trimmed = icon?.Trim() ?? string.Empty;
        // Keep it short (an emoji or two); fall back to a sparkle.
        return string.IsNullOrEmpty(trimmed) || trimmed.Length > 8 ? "✨" : trimmed;
    }
}
