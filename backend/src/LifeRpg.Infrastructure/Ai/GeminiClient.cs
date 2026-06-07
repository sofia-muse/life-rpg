using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using LifeRpg.Application.Common;
using Microsoft.Extensions.Options;

namespace LifeRpg.Infrastructure.Ai;

/// <summary>
/// Google Gemini implementation of <see cref="ILlmClient"/> (free AI Studio tier). Uses the
/// generateContent API with a JSON <c>responseSchema</c> so the model returns a structured skill
/// draft. The caller (SkillForgeService) is the trust boundary that validates/clamps the result.
/// </summary>
public class GeminiClient : ILlmClient
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    private const string SystemInstruction =
        "You are a game designer for a fantasy habit-tracker RPG. Invent ONE short, flavorful "
        + "passive skill personalized to the hero. Return only the structured fields. The skill must "
        + "boost exactly one of the six stats (strength, vitality, intelligence, charisma, dexterity, "
        + "willpower). bonusPercent must be a small integer between 1 and 10. icon must be a single "
        + "emoji. name <= 40 chars, description <= 160 chars. Avoid duplicating existing skill names.";

    // Gemini structured-output schema (uppercase type names per the API).
    private static readonly object ResponseSchema = new
    {
        type = "OBJECT",
        properties = new
        {
            name = new { type = "STRING" },
            description = new { type = "STRING" },
            icon = new { type = "STRING" },
            stat = new
            {
                type = "STRING",
                @enum = new[]
                {
                    "strength", "vitality", "intelligence", "charisma", "dexterity", "willpower",
                },
            },
            bonusPercent = new { type = "INTEGER" },
        },
        required = new[] { "name", "description", "icon", "stat", "bonusPercent" },
    };

    private readonly HttpClient _http;
    private readonly LlmOptions _options;

    public GeminiClient(HttpClient http, IOptions<LlmOptions> options)
    {
        _http = http;
        _options = options.Value;
    }

    public async Task<ForgedSkillDraft> ForgeSkillAsync(SkillForgePrompt prompt, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_options.ApiKey))
        {
            throw new InvalidOperationException(
                "LLM API key is not configured. Set 'Llm:ApiKey' (user-secrets or Key Vault).");
        }

        var existing = prompt.ExistingForgedNames.Count > 0
            ? $" Existing forged skills (avoid these names): {string.Join(", ", prompt.ExistingForgedNames)}."
            : string.Empty;

        var userText =
            $"Hero \"{prompt.HeroName}\", a level {prompt.HeroLevel} {prompt.ClassName}, "
            + $"whose dominant stat is {prompt.DominantStat}. Forge a fitting skill.{existing}";

        var body = new
        {
            systemInstruction = new { parts = new[] { new { text = SystemInstruction } } },
            contents = new[] { new { role = "user", parts = new[] { new { text = userText } } } },
            generationConfig = new
            {
                responseMimeType = "application/json",
                responseSchema = ResponseSchema,
                temperature = 1.0,
            },
        };

        var url = $"/v1beta/models/{_options.Model}:generateContent?key={_options.ApiKey}";
        using var res = await _http.PostAsJsonAsync(url, body, Json, ct);
        res.EnsureSuccessStatusCode();

        var payload = await res.Content.ReadFromJsonAsync<GeminiResponse>(Json, ct);
        var text = payload?.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text;
        if (string.IsNullOrWhiteSpace(text))
        {
            throw new InvalidOperationException("LLM returned an empty response.");
        }

        var draft = JsonSerializer.Deserialize<ForgedSkillDraft>(text, Json);
        return draft ?? throw new InvalidOperationException("Could not parse the forged skill.");
    }

    // Minimal shape of the Gemini generateContent response.
    private sealed record GeminiResponse([property: JsonPropertyName("candidates")] List<Candidate>? Candidates);
    private sealed record Candidate([property: JsonPropertyName("content")] Content? Content);
    private sealed record Content([property: JsonPropertyName("parts")] List<Part>? Parts);
    private sealed record Part([property: JsonPropertyName("text")] string? Text);
}
