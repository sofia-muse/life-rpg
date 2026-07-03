using LifeRpg.Application.Common;

namespace LifeRpg.IntegrationTests;

/// <summary>
/// Test double for <see cref="ILlmClient"/> — returns a configurable draft so tests can exercise
/// the forge service's validation/clamping without any real network call.
/// </summary>
public class FakeLlmClient : ILlmClient
{
    public ForgedSkillDraft NextDraft { get; set; } =
        new("Test Skill", "A forged skill for tests.", "🔥", "strength", 5);

    public QuestSuggestionPackDraft NextSuggestionPack { get; set; } =
        new([
            new SuggestedQuestDraft(
                "Focus Sprint",
                "Work on one meaningful task for 25 uninterrupted minutes.",
                "daily",
                "medium",
                "dexterity",
                "Supports clean execution and focus.",
                null),
        ]);

    public BossQuestPlanDraft NextBossPlan { get; set; } =
        new(
            "The Trial",
            "Finish the Big Goal",
            "Break a meaningful goal into clear campaign steps.",
            "hard",
            "willpower",
            4,
            ["Frame the goal", "Start the work", "Sustain the push", "Finish strong"],
            "Campaign Relic");

    public ChronicleDraft NextChronicle { get; set; } =
        new(
            "A Chapter of Progress",
            "Your recent victories are turning discipline into identity.",
            ["Held your streak", "Finished a meaningful quest", "Sharpened your class"]);

    public Task<ForgedSkillDraft> ForgeSkillAsync(SkillForgePrompt prompt, CancellationToken ct = default) =>
        Task.FromResult(NextDraft);

    public Task<QuestSuggestionPackDraft> SuggestQuestsAsync(
        QuestSuggestionPrompt prompt,
        CancellationToken ct = default) =>
        Task.FromResult(NextSuggestionPack);

    public Task<BossQuestPlanDraft> PlanBossQuestAsync(
        BossQuestPlanPrompt prompt,
        CancellationToken ct = default) =>
        Task.FromResult(NextBossPlan);

    public Task<ChronicleDraft> WriteChronicleAsync(
        ChroniclePrompt prompt,
        CancellationToken ct = default) =>
        Task.FromResult(NextChronicle);
}
