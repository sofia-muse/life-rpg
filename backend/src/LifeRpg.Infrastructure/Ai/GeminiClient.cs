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

    private const string SkillSystemInstruction =
        "You are a game designer for a fantasy habit-tracker RPG. Invent ONE short, flavorful "
        + "passive skill personalized to the hero. Return only the structured fields. The skill must "
        + "boost exactly one of the six stats (strength, vitality, intelligence, charisma, dexterity, "
        + "willpower). bonusPercent must be a small integer between 1 and 10. icon must be a single "
        + "emoji. name <= 40 chars, description <= 160 chars. Avoid duplicating existing skill names.";

    private const string QuestSuggestionSystemInstruction =
        "You are designing useful real-world quests for a self-mastery RPG. Return 3 or 4 concise quests "
        + "tailored to the hero. Keep them practical, specific, and easy to act on. Types must be daily, "
        + "side, or boss. Difficulties must be easy, medium, hard, or legendary. Stats must be one of the "
        + "six core stats. whyItFits should be one sentence.";

    private const string BossPlanSystemInstruction =
        "You are planning a long-form boss quest for a self-mastery RPG. Turn the user's real-life goal "
        + "into one motivating boss quest with a short saga title, one quest title, a concise description, "
        + "a difficulty, one target stat, a total step count between 3 and 8, 3 to 8 concrete step names, "
        + "and one flavorful reward title. Return only structured fields.";

    private const string ChronicleSystemInstruction =
        "You are writing a short heroic recap for a self-mastery RPG. Return one evocative chapter title, "
        + "one short narrative paragraph, and up to three highlight bullets grounded in the hero's recent "
        + "real-world victories. Keep it warm, concise, and non-clinical.";

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

    private static readonly object QuestSuggestionSchema = new
    {
        type = "OBJECT",
        properties = new
        {
            suggestions = new
            {
                type = "ARRAY",
                items = new
                {
                    type = "OBJECT",
                    properties = new
                    {
                        title = new { type = "STRING" },
                        description = new { type = "STRING" },
                        type = new
                        {
                            type = "STRING",
                            @enum = new[] { "daily", "side", "boss" },
                        },
                        difficulty = new
                        {
                            type = "STRING",
                            @enum = new[] { "easy", "medium", "hard", "legendary" },
                        },
                        stat = new
                        {
                            type = "STRING",
                            @enum = new[]
                            {
                                "strength", "vitality", "intelligence", "charisma", "dexterity", "willpower",
                            },
                        },
                        whyItFits = new { type = "STRING" },
                        totalSteps = new { type = "INTEGER" },
                    },
                    required = new[] { "title", "description", "type", "difficulty", "stat", "whyItFits" },
                },
            },
        },
        required = new[] { "suggestions" },
    };

    private static readonly object BossPlanSchema = new
    {
        type = "OBJECT",
        properties = new
        {
            sagaTitle = new { type = "STRING" },
            title = new { type = "STRING" },
            description = new { type = "STRING" },
            difficulty = new
            {
                type = "STRING",
                @enum = new[] { "easy", "medium", "hard", "legendary" },
            },
            stat = new
            {
                type = "STRING",
                @enum = new[]
                {
                    "strength", "vitality", "intelligence", "charisma", "dexterity", "willpower",
                },
            },
            totalSteps = new { type = "INTEGER" },
            steps = new
            {
                type = "ARRAY",
                items = new { type = "STRING" },
            },
            rewardTitle = new { type = "STRING" },
        },
        required = new[] { "sagaTitle", "title", "description", "difficulty", "stat", "totalSteps", "steps", "rewardTitle" },
    };

    private static readonly object ChronicleSchema = new
    {
        type = "OBJECT",
        properties = new
        {
            title = new { type = "STRING" },
            narrative = new { type = "STRING" },
            highlights = new
            {
                type = "ARRAY",
                items = new { type = "STRING" },
            },
        },
        required = new[] { "title", "narrative", "highlights" },
    };

    private readonly HttpClient _http;
    private readonly LlmOptions _options;

    public GeminiClient(HttpClient http, IOptions<LlmOptions> options)
    {
        _http = http;
        _options = options.Value;
    }

    private static bool IsTransient(System.Net.HttpStatusCode code) =>
        (int)code is 429 or 500 or 502 or 503;

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

        return await GenerateAsync<ForgedSkillDraft>(
            SkillSystemInstruction,
            userText,
            ResponseSchema,
            temperature: 1.0,
            ct);
    }

    public Task<QuestSuggestionPackDraft> SuggestQuestsAsync(
        QuestSuggestionPrompt prompt,
        CancellationToken ct = default)
    {
        var active = prompt.ActiveQuestTitles.Count > 0
            ? $" Active quests already on the board: {string.Join(", ", prompt.ActiveQuestTitles)}."
            : string.Empty;

        var userText =
            $"Hero \"{prompt.HeroName}\" is a level {prompt.HeroLevel} {prompt.ClassName} with dominant stat "
            + $"{prompt.DominantStat} and a current streak of {prompt.CurrentStreak}.{active} Suggest quests "
            + $"that reinforce their class identity while staying realistic for daily life.";

        return GenerateAsync<QuestSuggestionPackDraft>(
            QuestSuggestionSystemInstruction,
            userText,
            QuestSuggestionSchema,
            temperature: 0.9,
            ct);
    }

    public Task<BossQuestPlanDraft> PlanBossQuestAsync(
        BossQuestPlanPrompt prompt,
        CancellationToken ct = default)
    {
        var suggestedStat = string.IsNullOrWhiteSpace(prompt.SuggestedStat)
            ? string.Empty
            : $" Favor the {prompt.SuggestedStat} stat if it fits the goal.";

        var userText =
            $"Hero \"{prompt.HeroName}\" is a level {prompt.HeroLevel} {prompt.ClassName} whose dominant stat is "
            + $"{prompt.DominantStat}. Real-world goal: {prompt.Goal}.{suggestedStat}";

        return GenerateAsync<BossQuestPlanDraft>(
            BossPlanSystemInstruction,
            userText,
            BossPlanSchema,
            temperature: 0.9,
            ct);
    }

    public Task<ChronicleDraft> WriteChronicleAsync(
        ChroniclePrompt prompt,
        CancellationToken ct = default)
    {
        var victories = prompt.RecentVictories.Count > 0
            ? string.Join(", ", prompt.RecentVictories)
            : "steady discipline and small wins";

        var userText =
            $"Write a short chronicle for {prompt.HeroName}, a level {prompt.HeroLevel} {prompt.ClassName} "
            + $"whose dominant stat is {prompt.DominantStat}. Current streak: {prompt.CurrentStreak}. "
            + $"Recent victories: {victories}.";

        return GenerateAsync<ChronicleDraft>(
            ChronicleSystemInstruction,
            userText,
            ChronicleSchema,
            temperature: 0.8,
            ct);
    }

    private async Task<T> GenerateAsync<T>(
        string systemInstruction,
        string userText,
        object responseSchema,
        double temperature,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(_options.ApiKey))
        {
            throw new InvalidOperationException(
                "LLM API key is not configured. Set 'Llm:ApiKey' (user-secrets or Key Vault).");
        }

        var body = new
        {
            systemInstruction = new { parts = new[] { new { text = systemInstruction } } },
            contents = new[] { new { role = "user", parts = new[] { new { text = userText } } } },
            generationConfig = new
            {
                responseMimeType = "application/json",
                responseSchema,
                temperature,
            },
        };

        var url = $"/v1beta/models/{_options.Model}:generateContent?key={_options.ApiKey}";

        HttpResponseMessage res = await _http.PostAsJsonAsync(url, body, Json, ct);
        for (var attempt = 1; attempt < 3 && IsTransient(res.StatusCode); attempt++)
        {
            res.Dispose();
            await Task.Delay(TimeSpan.FromMilliseconds(600 * attempt * attempt), ct);
            res = await _http.PostAsJsonAsync(url, body, Json, ct);
        }

        res.EnsureSuccessStatusCode();
        var payload = await res.Content.ReadFromJsonAsync<GeminiResponse>(Json, ct);
        res.Dispose();
        var text = payload?.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text;
        if (string.IsNullOrWhiteSpace(text))
        {
            throw new InvalidOperationException("LLM returned an empty response.");
        }

        var draft = JsonSerializer.Deserialize<T>(text, Json);
        return draft ?? throw new InvalidOperationException("Could not parse the structured LLM response.");
    }

    // Minimal shape of the Gemini generateContent response.
    private sealed record GeminiResponse([property: JsonPropertyName("candidates")] List<Candidate>? Candidates);
    private sealed record Candidate([property: JsonPropertyName("content")] Content? Content);
    private sealed record Content([property: JsonPropertyName("parts")] List<Part>? Parts);
    private sealed record Part([property: JsonPropertyName("text")] string? Text);
}
