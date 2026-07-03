using LifeRpg.Application.Common;
using LifeRpg.Application.Dtos;
using LifeRpg.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LifeRpg.Application.Services;

public class GuidanceService
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUser _user;
    private readonly ILlmClient _llm;

    public GuidanceService(IAppDbContext db, ICurrentUser user, ILlmClient llm)
    {
        _db = db;
        _user = user;
        _llm = llm;
    }

    public async Task<Result<QuestSuggestionPackDto>> SuggestQuestsAsync(CancellationToken ct = default)
    {
        var hero = await HeroWithQuestsAsync(ct);
        if (hero is null)
        {
            return _user.IsAuthenticated
                ? Result<QuestSuggestionPackDto>.NotFound("Hero not found")
                : Result<QuestSuggestionPackDto>.Unauthorized();
        }

        QuestSuggestionPackDraft draft;
        try
        {
            draft = await _llm.SuggestQuestsAsync(
                new QuestSuggestionPrompt(
                    hero.Name,
                    hero.ClassName,
                    hero.DominantStat.ToString(),
                    hero.HeroLevel,
                    hero.CurrentStreak,
                    hero.Quests.Where(q => q.IsActive && !q.IsCompleted).Select(q => q.Title).Take(8).ToList()),
                ct);
        }
        catch (Exception ex)
        {
            return Result<QuestSuggestionPackDto>.Failure(ErrorType.Validation, $"Quest guidance failed: {ex.Message}");
        }

        var suggestions = (draft.Suggestions ?? Array.Empty<SuggestedQuestDraft>())
            .Select(suggestion => SanitizeSuggestion(suggestion, hero.DominantStat))
            .Where(suggestion => !string.IsNullOrWhiteSpace(suggestion.Title))
            .Take(4)
            .ToList();

        if (suggestions.Count == 0)
        {
            return Result<QuestSuggestionPackDto>.Failure(ErrorType.Validation, "Quest guidance returned no usable suggestions.");
        }

        return Result<QuestSuggestionPackDto>.Success(new QuestSuggestionPackDto($"{hero.ClassName} Contract", suggestions));
    }

    public async Task<Result<BossQuestPlanDto>> PlanBossQuestAsync(BossQuestPlanRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Goal))
        {
            return Result<BossQuestPlanDto>.Validation("Goal is required");
        }

        var hero = await HeroWithQuestsAsync(ct);
        if (hero is null)
        {
            return _user.IsAuthenticated
                ? Result<BossQuestPlanDto>.NotFound("Hero not found")
                : Result<BossQuestPlanDto>.Unauthorized();
        }

        BossQuestPlanDraft draft;
        try
        {
            draft = await _llm.PlanBossQuestAsync(
                new BossQuestPlanPrompt(
                    hero.Name,
                    hero.ClassName,
                    hero.DominantStat.ToString(),
                    hero.HeroLevel,
                    request.Goal.Trim(),
                    request.SuggestedStat?.ToString().ToLowerInvariant()),
                ct);
        }
        catch (Exception ex)
        {
            return Result<BossQuestPlanDto>.Failure(ErrorType.Validation, $"Boss planning failed: {ex.Message}");
        }

        return Result<BossQuestPlanDto>.Success(SanitizeBossPlan(draft, hero.DominantStat));
    }

    public async Task<Result<ChronicleDto>> ChronicleAsync(CancellationToken ct = default)
    {
        var hero = await HeroWithQuestsAsync(ct);
        if (hero is null)
        {
            return _user.IsAuthenticated
                ? Result<ChronicleDto>.NotFound("Hero not found")
                : Result<ChronicleDto>.Unauthorized();
        }

        var recentVictories = hero.Quests
            .Where(q => q.IsCompleted)
            .OrderByDescending(q => q.CompletedAt ?? q.UpdatedAt)
            .Select(q => q.Title)
            .Distinct()
            .Take(6)
            .ToList();

        ChronicleDraft draft;
        try
        {
            draft = await _llm.WriteChronicleAsync(
                new ChroniclePrompt(
                    hero.Name,
                    hero.ClassName,
                    hero.DominantStat.ToString(),
                    hero.HeroLevel,
                    hero.CurrentStreak,
                    recentVictories),
                ct);
        }
        catch (Exception ex)
        {
            return Result<ChronicleDto>.Failure(ErrorType.Validation, $"Chronicle failed: {ex.Message}");
        }

        return Result<ChronicleDto>.Success(new ChronicleDto(
            Truncate(string.IsNullOrWhiteSpace(draft.Title) ? $"{hero.Name}'s Chronicle" : draft.Title.Trim(), 70),
            Truncate(
                string.IsNullOrWhiteSpace(draft.Narrative)
                    ? $"{hero.Name} is shaping the path of a {hero.ClassName} through steady real-world action."
                    : draft.Narrative.Trim(),
                320),
            (draft.Highlights ?? Array.Empty<string>())
                .Where(highlight => !string.IsNullOrWhiteSpace(highlight))
                .Select(highlight => Truncate(highlight.Trim(), 80))
                .Take(3)
                .ToList()));
    }

    private async Task<Domain.Entities.Hero?> HeroWithQuestsAsync(CancellationToken ct) =>
        _user.UserId is { } userId
            ? await _db.Heroes.Include(h => h.Quests).FirstOrDefaultAsync(h => h.UserId == userId, ct)
            : null;

    private static SuggestedQuestDto SanitizeSuggestion(SuggestedQuestDraft draft, StatName fallbackStat)
    {
        var stat = Enum.TryParse<StatName>(draft.Stat, true, out var parsedStat) ? parsedStat : fallbackStat;
        var type = Enum.TryParse<QuestType>(draft.Type, true, out var parsedType) ? parsedType : QuestType.Side;
        var difficulty = Enum.TryParse<QuestDifficulty>(draft.Difficulty, true, out var parsedDifficulty)
            ? parsedDifficulty
            : QuestDifficulty.Medium;
        int? totalSteps = type == QuestType.Boss
            ? Math.Clamp(draft.TotalSteps ?? 5, 3, 30)
            : null;

        return new SuggestedQuestDto(
            Truncate(string.IsNullOrWhiteSpace(draft.Title) ? "Suggested Quest" : draft.Title.Trim(), 60),
            Truncate(draft.Description?.Trim() ?? string.Empty, 180),
            type,
            difficulty,
            stat,
            Truncate(draft.WhyItFits?.Trim() ?? string.Empty, 120),
            totalSteps);
    }

    private static BossQuestPlanDto SanitizeBossPlan(BossQuestPlanDraft draft, StatName fallbackStat)
    {
        var stat = Enum.TryParse<StatName>(draft.Stat, true, out var parsedStat) ? parsedStat : fallbackStat;
        var difficulty = Enum.TryParse<QuestDifficulty>(draft.Difficulty, true, out var parsedDifficulty)
            ? parsedDifficulty
            : QuestDifficulty.Hard;
        var steps = (draft.Steps ?? Array.Empty<string>())
            .Where(step => !string.IsNullOrWhiteSpace(step))
            .Select(step => Truncate(step.Trim(), 60))
            .Take(8)
            .ToList();

        if (steps.Count == 0)
        {
            steps =
            [
                "Frame the mission",
                "Start the first push",
                "Sustain the habit loop",
                "Finish the campaign",
            ];
        }

        return new BossQuestPlanDto(
            Truncate(string.IsNullOrWhiteSpace(draft.SagaTitle) ? "Forged Saga" : draft.SagaTitle.Trim(), 70),
            Truncate(string.IsNullOrWhiteSpace(draft.Title) ? "Forged Boss Quest" : draft.Title.Trim(), 70),
            Truncate(draft.Description?.Trim() ?? string.Empty, 220),
            difficulty,
            stat,
            Math.Clamp(draft.TotalSteps, 3, 30),
            steps,
            Truncate(string.IsNullOrWhiteSpace(draft.RewardTitle) ? "Campaign Relic" : draft.RewardTitle.Trim(), 70));
    }

    private static string Truncate(string value, int max) =>
        value.Length <= max ? value : value[..max];
}
