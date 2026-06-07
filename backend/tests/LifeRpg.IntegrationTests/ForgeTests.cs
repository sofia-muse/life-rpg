using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using LifeRpg.Application.Common;
using LifeRpg.Application.Dtos;
using LifeRpg.Application.Services;
using LifeRpg.Domain.Enums;
using Xunit;

namespace LifeRpg.IntegrationTests;

public class ForgeTests : IClassFixture<LifeRpgApiFactory>
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter(System.Text.Json.JsonNamingPolicy.CamelCase) },
    };

    private readonly LifeRpgApiFactory _factory;

    public ForgeTests(LifeRpgApiFactory factory) => _factory = factory;

    private async Task<HttpClient> HeroClientAsync(string email, StatName focus)
    {
        var client = _factory.CreateClient();
        var auth = await (await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest(email, "Passw0rd!23", "Forger"))).Content.ReadFromJsonAsync<AuthResponse>(Json);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.AccessToken);
        await client.PostAsJsonAsync("/api/v1/heroes",
            new CreateHeroRequest("Forged", "f", new() { focus }));
        return client;
    }

    [Fact]
    public async Task Forge_returns_skill_and_clamps_an_out_of_range_percent()
    {
        var client = await HeroClientAsync("forge1@example.com", StatName.Strength);
        // Model tries to grant a wildly inflated 99% — the server must clamp to 10.
        _factory.Llm.NextDraft = new ForgedSkillDraft("Berserker Might", "Rage incarnate.", "🔥", "strength", 99);

        var res = await client.PostAsync("/api/v1/skills/forge", null);
        res.StatusCode.Should().Be(HttpStatusCode.OK);
        var skill = await res.Content.ReadFromJsonAsync<SkillDto>(Json);

        skill!.Effect.Should().Be("+10% XP on Strength quests", "percent is clamped to the 1–10 cap");
        skill.Category.Should().Be("strength");
        skill.Id.Should().StartWith("forged-");
    }

    [Fact]
    public async Task Forge_falls_back_to_dominant_stat_when_model_returns_an_invalid_stat()
    {
        var client = await HeroClientAsync("forge2@example.com", StatName.Intelligence);
        _factory.Llm.NextDraft = new ForgedSkillDraft("Mystery", "Unknown stat.", "❓", "banana", 5);

        var skill = await (await client.PostAsync("/api/v1/skills/forge", null))
            .Content.ReadFromJsonAsync<SkillDto>(Json);

        skill!.Category.Should().Be("intelligence", "invalid stat falls back to the hero's dominant stat");
    }

    [Fact]
    public async Task Forged_skills_are_listed_and_capped_per_hero()
    {
        var client = await HeroClientAsync("forge3@example.com", StatName.Vitality);
        _factory.Llm.NextDraft = new ForgedSkillDraft("Vital Spark", "Health flows.", "💚", "vitality", 4);

        for (var i = 0; i < SkillForgeService.MaxForgedPerHero; i++)
        {
            (await client.PostAsync("/api/v1/skills/forge", null)).StatusCode.Should().Be(HttpStatusCode.OK);
        }

        // One past the cap is rejected.
        (await client.PostAsync("/api/v1/skills/forge", null)).StatusCode
            .Should().Be(HttpStatusCode.Conflict);

        var forged = await client.GetFromJsonAsync<List<SkillDto>>("/api/v1/skills/forged", Json);
        forged!.Should().HaveCount(SkillForgeService.MaxForgedPerHero);
    }

    [Fact]
    public async Task Forged_skill_boosts_matching_quest_xp()
    {
        var client = await HeroClientAsync("forge4@example.com", StatName.Strength);
        _factory.Llm.NextDraft = new ForgedSkillDraft("Iron Surge", "+10% strength.", "💪", "strength", 10);
        await client.PostAsync("/api/v1/skills/forge", null);

        var quest = await (await client.PostAsJsonAsync("/api/v1/quests",
            new CreateQuestRequest("Lift", "", QuestType.Side, QuestDifficulty.Hard, StatName.Strength, null)))
            .Content.ReadFromJsonAsync<QuestDto>(Json);

        var result = await (await client.PostAsync($"/api/v1/quests/{quest!.Id}/complete", null))
            .Content.ReadFromJsonAsync<CompleteQuestResult>(Json);

        // Hard base = 50; +10% forged bonus = floor(50*0.10) = 5.
        result!.SkillBonus.Should().Be(5);
        result.XpAwarded.Should().Be(55);
    }
}
