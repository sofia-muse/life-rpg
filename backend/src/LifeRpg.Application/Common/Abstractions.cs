using LifeRpg.Domain.Entities;
using LifeRpg.Application.Identity;
using Microsoft.EntityFrameworkCore;

namespace LifeRpg.Application.Common;

/// <summary>Persistence surface the Application layer depends on (implemented by the DbContext).</summary>
public interface IAppDbContext
{
    DbSet<Hero> Heroes { get; }
    DbSet<Quest> Quests { get; }
    DbSet<UnlockedSkill> UnlockedSkills { get; }
    DbSet<GeneratedSkill> GeneratedSkills { get; }
    DbSet<JournalEntry> JournalEntries { get; }
    DbSet<QuestCompletion> QuestCompletions { get; }
    DbSet<SyncRequestLog> SyncRequestLogs { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

/// <summary>The authenticated caller (implemented in the API from the JWT).</summary>
public interface ICurrentUser
{
    Guid? UserId { get; }
    bool IsAuthenticated { get; }
}

public interface IClock
{
    DateTimeOffset UtcNow { get; }
    DateOnly Today { get; }
}

public sealed class SystemClock : IClock
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
    public DateOnly Today => DateOnly.FromDateTime(DateTime.UtcNow);
}

/// <summary>Issues JWT access tokens and opaque refresh tokens (implemented in Infrastructure).</summary>
public interface ITokenService
{
    (string AccessToken, DateTimeOffset ExpiresAt) CreateAccessToken(Guid userId, string email);
    string CreateRefreshToken();
    string HashRefreshToken(string rawToken);
}

/// <summary>Context handed to the LLM when forging a personalized skill.</summary>
public sealed record SkillForgePrompt(
    string HeroName,
    string ClassName,
    string DominantStat,
    int HeroLevel,
    IReadOnlyList<string> ExistingForgedNames);

/// <summary>Raw structured fields returned by the LLM (validated/clamped by the forge service).</summary>
public sealed record ForgedSkillDraft(
    string Name,
    string Description,
    string Icon,
    string Stat,
    int BonusPercent);

public sealed record QuestSuggestionPrompt(
    string HeroName,
    string ClassName,
    string DominantStat,
    int HeroLevel,
    int CurrentStreak,
    IReadOnlyList<string> ActiveQuestTitles);

public sealed record SuggestedQuestDraft(
    string Title,
    string Description,
    string Type,
    string Difficulty,
    string Stat,
    string WhyItFits,
    int? TotalSteps);

public sealed record QuestSuggestionPackDraft(IReadOnlyList<SuggestedQuestDraft> Suggestions);

public sealed record BossQuestPlanPrompt(
    string HeroName,
    string ClassName,
    string DominantStat,
    int HeroLevel,
    string Goal,
    string? SuggestedStat);

public sealed record BossQuestPlanDraft(
    string SagaTitle,
    string Title,
    string Description,
    string Difficulty,
    string Stat,
    int TotalSteps,
    IReadOnlyList<string> Steps,
    string RewardTitle);

public sealed record ChroniclePrompt(
    string HeroName,
    string ClassName,
    string DominantStat,
    int HeroLevel,
    int CurrentStreak,
    IReadOnlyList<string> RecentVictories);

public sealed record ChronicleDraft(
    string Title,
    string Narrative,
    IReadOnlyList<string> Highlights);

/// <summary>Generates skill flavor via an LLM (implemented in Infrastructure; stubbed in tests).</summary>
public interface ILlmClient
{
    Task<ForgedSkillDraft> ForgeSkillAsync(SkillForgePrompt prompt, CancellationToken ct = default);
    Task<QuestSuggestionPackDraft> SuggestQuestsAsync(QuestSuggestionPrompt prompt, CancellationToken ct = default);
    Task<BossQuestPlanDraft> PlanBossQuestAsync(BossQuestPlanPrompt prompt, CancellationToken ct = default);
    Task<ChronicleDraft> WriteChronicleAsync(ChroniclePrompt prompt, CancellationToken ct = default);
}
