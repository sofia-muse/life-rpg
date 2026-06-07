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

    public Task<ForgedSkillDraft> ForgeSkillAsync(SkillForgePrompt prompt, CancellationToken ct = default) =>
        Task.FromResult(NextDraft);
}
