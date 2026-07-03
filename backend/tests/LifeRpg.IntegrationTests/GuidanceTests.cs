using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using LifeRpg.Application.Common;
using LifeRpg.Application.Dtos;
using LifeRpg.Domain.Enums;
using Xunit;

namespace LifeRpg.IntegrationTests;

public class GuidanceTests : IClassFixture<LifeRpgApiFactory>
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter(System.Text.Json.JsonNamingPolicy.CamelCase) },
    };

    private readonly LifeRpgApiFactory _factory;

    public GuidanceTests(LifeRpgApiFactory factory) => _factory = factory;

    private async Task<HttpClient> HeroClientAsync(string email, StatName focus)
    {
        var client = _factory.CreateClient();
        var auth = await (await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest(email, "Passw0rd!23", "Strategist"))).Content.ReadFromJsonAsync<AuthResponse>(Json);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.AccessToken);
        await client.PostAsJsonAsync("/api/v1/heroes",
            new CreateHeroRequest("Strategist", "s", new() { focus }));
        return client;
    }

    [Fact]
    public async Task Guidance_quests_returns_structured_suggestions()
    {
        var client = await HeroClientAsync("guide1@example.com", StatName.Dexterity);
        _factory.Llm.NextSuggestionPack = new QuestSuggestionPackDraft(
        [
            new SuggestedQuestDraft(
                "Focus Sprint",
                "Work on one meaningful task for 25 uninterrupted minutes.",
                "daily",
                "medium",
                "dexterity",
                "Supports clean execution and focus.",
                null),
            new SuggestedQuestDraft(
                "Ship a Milestone",
                "Close one meaningful project milestone this week.",
                "side",
                "hard",
                "dexterity",
                "Fits a builder who gains momentum by finishing.",
                null),
        ]);

        var res = await client.GetAsync("/api/v1/guidance/quests");
        res.StatusCode.Should().Be(HttpStatusCode.OK);
        var pack = await res.Content.ReadFromJsonAsync<QuestSuggestionPackDto>(Json);

        pack!.Suggestions.Should().HaveCount(2);
        pack.Suggestions[0].Type.Should().Be(QuestType.Daily);
        pack.Suggestions[0].Stat.Should().Be(StatName.Dexterity);
    }

    [Fact]
    public async Task Guidance_boss_plan_clamps_and_fills_missing_steps()
    {
        var client = await HeroClientAsync("guide2@example.com", StatName.Willpower);
        _factory.Llm.NextBossPlan = new BossQuestPlanDraft(
            "The Long Trial",
            "Conquer the Goal",
            "Finish a meaningful long-term goal.",
            "legendary",
            "banana",
            2,
            [],
            "Crown of Follow-Through");

        var plan = await (await client.PostAsJsonAsync("/api/v1/guidance/boss-plan",
            new BossQuestPlanRequest("Finish the course", StatName.Willpower)))
            .Content.ReadFromJsonAsync<BossQuestPlanDto>(Json);

        plan!.Stat.Should().Be(StatName.Willpower);
        plan.TotalSteps.Should().Be(3);
        plan.Steps.Should().NotBeEmpty();
    }

    [Fact]
    public async Task Guidance_chronicle_returns_shareable_copy()
    {
        var client = await HeroClientAsync("guide3@example.com", StatName.Intelligence);
        _factory.Llm.NextChronicle = new ChronicleDraft(
            "Chapter of Focus",
            "You kept showing up and your class is starting to reflect it.",
            ["Held the line", "Finished the reading block"]);

        var res = await client.GetAsync("/api/v1/guidance/chronicle");
        res.StatusCode.Should().Be(HttpStatusCode.OK);
        var chronicle = await res.Content.ReadFromJsonAsync<ChronicleDto>(Json);

        chronicle!.Title.Should().Be("Chapter of Focus");
        chronicle.Highlights.Should().Contain("Held the line");
    }
}
