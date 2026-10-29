using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using LifeRpg.Application.Dtos;
using Xunit;

namespace LifeRpg.IntegrationTests;

public class ApiFlowTests : IClassFixture<LifeRpgApiFactory>
{
    [Fact]
    public async Task Painted_portrait_survives_create_update_and_reload()
    {
        var client = await AuthedClientAsync("portrait-roundtrip@example.com");
        var appearance = new Domain.ValueObjects.CharacterAppearance
        {
            PortraitStyle = "painted", PortraitId = "moonweaver", HairColor = 3
        };
        var created = await client.PostAsJsonAsync("/api/v1/heroes",
            new CreateHeroRequest("Elara", "portrait", new() { Domain.Enums.StatName.Intelligence }, appearance));
        created.StatusCode.Should().Be(HttpStatusCode.OK);
        var first = await client.GetFromJsonAsync<HeroDto>("/api/v1/heroes/me", Json);
        first!.CharacterAppearance.PortraitId.Should().Be("moonweaver");
        appearance.PortraitId = "wildwood";
        var updated = await client.PutAsJsonAsync("/api/v1/heroes/me/appearance",
            new UpdateAppearanceRequest(null, appearance));
        updated.StatusCode.Should().Be(HttpStatusCode.OK);
        var reloaded = await client.GetFromJsonAsync<HeroDto>("/api/v1/heroes/me", Json);
        reloaded!.CharacterAppearance.PortraitStyle.Should().Be("painted");
        reloaded.CharacterAppearance.PortraitId.Should().Be("wildwood");
        reloaded.CharacterAppearance.HairColor.Should().Be(3);
    }


    [Fact]
    public async Task Daily_and_rest_rewards_are_idempotent_and_sync_cannot_forge_xp()
    {
        var client = await AuthedClientAsync("reliable-reward@example.com");
        await client.PostAsJsonAsync("/api/v1/heroes", new CreateHeroRequest("Reader", "reader", new() { Domain.Enums.StatName.Intelligence }));
        var first = await (await client.PostAsync("/api/v1/heroes/me/rest-day", null)).Content.ReadFromJsonAsync<HeroDto>(Json);
        var repeated = await (await client.PostAsync("/api/v1/heroes/me/rest-day", null)).Content.ReadFromJsonAsync<HeroDto>(Json);
        first!.StatXp.Vitality.Should().Be(10);
        repeated!.StatXp.Vitality.Should().Be(10);
        repeated.RestDaysUsed.Should().Be(1);
        repeated.LastRestDayDate.Should().NotBeNullOrWhiteSpace();
        var login = await (await client.PostAsync("/api/v1/heroes/me/daily-reward", null)).Content.ReadFromJsonAsync<HeroDto>(Json);
        var retry = await (await client.PostAsync("/api/v1/heroes/me/daily-reward", null)).Content.ReadFromJsonAsync<HeroDto>(Json);
        retry!.StatXp.Intelligence.Should().Be(login!.StatXp.Intelligence);
        retry.TotalLoginDays.Should().Be(1);
        var sync = await client.PostAsJsonAsync("/api/v1/sync", new SyncBatchRequest(null, new()
        {
            new SyncOperation("forged-reward", "hero", "upsert", JsonSerializer.SerializeToElement(new { statXP = new { intelligence = 999999 }, totalQuestsCompleted = 999, currentStreak = 999 }))
        }));
        sync.StatusCode.Should().Be(HttpStatusCode.OK);
        var reloaded = await client.GetFromJsonAsync<HeroDto>("/api/v1/heroes/me", Json);
        reloaded!.StatXp.Intelligence.Should().Be(retry.StatXp.Intelligence);
        reloaded.CurrentStreak.Should().Be(0);
        reloaded.TotalQuestsCompleted.Should().Be(0);
    }

    [Fact]
    public async Task Weekly_credit_survives_daily_reset_and_history_is_readable()
    {
        var client = await AuthedClientAsync("history-credit@example.com");
        var hero = await (await client.PostAsJsonAsync("/api/v1/heroes", new CreateHeroRequest("Reader", "reader", new() { Domain.Enums.StatName.Intelligence }))).Content.ReadFromJsonAsync<HeroDto>(Json);
        var quest = await (await client.PostAsJsonAsync("/api/v1/quests", new CreateQuestRequest("Read", "", Domain.Enums.QuestType.Daily, Domain.Enums.QuestDifficulty.Easy, Domain.Enums.StatName.Intelligence, null))).Content.ReadFromJsonAsync<QuestDto>(Json);
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<LifeRpg.Infrastructure.Persistence.LifeRpgDbContext>();
            var tracked = db.Heroes.Single(h => h.Id == hero!.Id);
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var weekStart = today.AddDays(-((int)today.DayOfWeek + 6) % 7);
            tracked.Settings.WeeklyPath = "focus";
            tracked.Settings.WeeklyPathWeekKey = weekStart.ToString("yyyy-MM-dd");
            db.QuestCompletions.Add(new Domain.Entities.QuestCompletion { HeroId = hero!.Id, QuestId = quest!.Id, Stat = Domain.Enums.StatName.Intelligence, CompletionDate = weekStart, CompletedAt = new DateTimeOffset(weekStart.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero), XpAwarded = 15 });
            await db.SaveChangesAsync();
        }
        // Quest is currently incomplete, but the historical completion must still count.
        var cup = await client.GetFromJsonAsync<WeeklyCupDto>("/api/v1/heroes/me/weekly-cup", Json);
        cup!.CompletedMatches.Should().Be(1);
        var facts = await client.GetFromJsonAsync<List<CompletionEventDto>>("/api/v1/heroes/me/completions", Json);
        facts.Should().ContainSingle();
        facts![0].QuestId.Should().Be(quest!.Id);
    }

    [Fact]
    public async Task Sync_returns_explicit_full_quest_snapshot_even_when_since_is_recent()
    {
        var client = await AuthedClientAsync("sync-snapshot@example.com");
        await client.PostAsJsonAsync("/api/v1/heroes", new CreateHeroRequest("Sia", "sia", new() { Domain.Enums.StatName.Intelligence }));
        await client.PostAsJsonAsync("/api/v1/quests", new CreateQuestRequest("First", "", Domain.Enums.QuestType.Side, Domain.Enums.QuestDifficulty.Easy, Domain.Enums.StatName.Intelligence, null));
        await client.PostAsJsonAsync("/api/v1/quests", new CreateQuestRequest("Second", "", Domain.Enums.QuestType.Side, Domain.Enums.QuestDifficulty.Easy, Domain.Enums.StatName.Intelligence, null));
        var result = await (await client.PostAsJsonAsync("/api/v1/sync", new SyncBatchRequest(DateTimeOffset.UtcNow.AddDays(1), new()))).Content.ReadFromJsonAsync<SyncBatchResult>(Json);
        result!.ServerChanges.Kind.Should().Be("snapshot");
        result.ServerChanges.Quests.Should().HaveCount(2);
    }

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter(System.Text.Json.JsonNamingPolicy.CamelCase) },
    };
    private readonly LifeRpgApiFactory _factory;
    private readonly HttpClient _client;

    public ApiFlowTests(LifeRpgApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<HttpClient> AuthedClientAsync(string email)
    {
        var res = await _client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest(email, "Passw0rd!23", "Tester"));
        res.StatusCode.Should().Be(HttpStatusCode.OK);
        var auth = await res.Content.ReadFromJsonAsync<AuthResponse>(Json);
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.AccessToken);
        return client;
    }

    [Fact]
    public async Task Health_ready_returns_healthy()
    {
        var res = await _client.GetAsync("/health/ready");
        res.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Skills_catalog_is_public_and_has_36()
    {
        var skills = await _client.GetFromJsonAsync<List<SkillDto>>("/api/v1/skills", Json);
        skills.Should().HaveCount(36);
    }

    [Fact]
    public async Task Protected_endpoint_requires_auth()
    {
        var res = await _client.GetAsync("/api/v1/heroes/me");
        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Full_flow_register_create_hero_quest_complete_awards_xp()
    {
        var client = await AuthedClientAsync("flow@example.com");

        var heroRes = await client.PostAsJsonAsync("/api/v1/heroes",
            new CreateHeroRequest("Aria", "aria", new() { Domain.Enums.StatName.Strength }));
        heroRes.StatusCode.Should().Be(HttpStatusCode.OK);
        var hero = await heroRes.Content.ReadFromJsonAsync<HeroDto>(Json);
        hero!.StatXp.Strength.Should().Be(50, "focus stat is seeded with 50 XP");
        hero.ClassName.Should().Be("Apprentice Warrior");

        var questRes = await client.PostAsJsonAsync("/api/v1/quests",
            new CreateQuestRequest("Deadlift", "", Domain.Enums.QuestType.Side, Domain.Enums.QuestDifficulty.Hard,
                Domain.Enums.StatName.Strength, null));
        var quest = await questRes.Content.ReadFromJsonAsync<QuestDto>(Json);
        quest!.XpReward.Should().Be(50, "server sets XP from difficulty, not the client");

        var completeRes = await client.PostAsync($"/api/v1/quests/{quest.Id}/complete", null);
        completeRes.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await completeRes.Content.ReadFromJsonAsync<CompleteQuestResult>(Json);
        result!.XpAwarded.Should().Be(50);
        result.Hero.StatXp.Strength.Should().Be(100, "50 seeded + 50 awarded");
        result.Hero.CurrentStreak.Should().Be(1, "first activity starts the streak");

        // Persisted.
        var persisted = await client.GetFromJsonAsync<HeroDto>("/api/v1/heroes/me", Json);
        persisted!.StatXp.Strength.Should().Be(100);
        persisted.TotalQuestsCompleted.Should().Be(1);
    }

    [Fact]
    public async Task Daily_quest_cannot_be_completed_twice_in_a_day()
    {
        var client = await AuthedClientAsync("daily@example.com");
        await client.PostAsJsonAsync("/api/v1/heroes",
            new CreateHeroRequest("Dee", "dee", new() { Domain.Enums.StatName.Vitality }));

        var quest = await (await client.PostAsJsonAsync("/api/v1/quests",
            new CreateQuestRequest("Water", "", Domain.Enums.QuestType.Daily, Domain.Enums.QuestDifficulty.Easy,
                Domain.Enums.StatName.Vitality, null))).Content.ReadFromJsonAsync<QuestDto>(Json);

        (await client.PostAsync($"/api/v1/quests/{quest!.Id}/complete", null)).StatusCode
            .Should().Be(HttpStatusCode.OK);
        (await client.PostAsync($"/api/v1/quests/{quest.Id}/complete", null)).StatusCode
            .Should().Be(HttpStatusCode.Conflict, "daily quests complete once per day (anti-cheat)");
    }

    [Fact]
    public async Task Side_quest_cannot_be_replayed_after_completion()
    {
        var client = await AuthedClientAsync("side-replay@example.com");
        await client.PostAsJsonAsync("/api/v1/heroes",
            new CreateHeroRequest("Sia", "sia", new() { Domain.Enums.StatName.Dexterity }));

        var quest = await (await client.PostAsJsonAsync("/api/v1/quests",
            new CreateQuestRequest("Sprint", "", Domain.Enums.QuestType.Side, Domain.Enums.QuestDifficulty.Medium,
                Domain.Enums.StatName.Dexterity, null))).Content.ReadFromJsonAsync<QuestDto>(Json);

        (await client.PostAsync($"/api/v1/quests/{quest!.Id}/complete", null)).StatusCode
            .Should().Be(HttpStatusCode.OK);
        (await client.PostAsync($"/api/v1/quests/{quest.Id}/complete", null)).StatusCode
            .Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Boss_quest_requires_step_progression_before_reward()
    {
        var client = await AuthedClientAsync("boss@example.com");
        await client.PostAsJsonAsync("/api/v1/heroes",
            new CreateHeroRequest("Bossy", "bossy", new() { Domain.Enums.StatName.Charisma }));

        var quest = await (await client.PostAsJsonAsync("/api/v1/quests",
            new CreateQuestRequest("Lead the raid", "", Domain.Enums.QuestType.Boss, Domain.Enums.QuestDifficulty.Hard,
                Domain.Enums.StatName.Charisma, 2))).Content.ReadFromJsonAsync<QuestDto>(Json);

        (await client.PostAsync($"/api/v1/quests/{quest!.Id}/complete", null)).StatusCode
            .Should().Be(HttpStatusCode.Conflict);

        var firstStep = await (await client.PostAsync($"/api/v1/quests/{quest.Id}/boss-step", null))
            .Content.ReadFromJsonAsync<AdvanceBossQuestResult>(Json);
        firstStep!.Completion.Should().BeNull();
        firstStep.Quest.CompletedSteps.Should().Be(1);
        firstStep.Quest.IsCompleted.Should().BeFalse();

        var secondStep = await (await client.PostAsync($"/api/v1/quests/{quest.Id}/boss-step", null))
            .Content.ReadFromJsonAsync<AdvanceBossQuestResult>(Json);
        secondStep!.Completion.Should().NotBeNull();
        secondStep.Quest.CompletedSteps.Should().Be(2);
        secondStep.Quest.IsCompleted.Should().BeTrue();
        secondStep.Completion!.Hero.TotalQuestsCompleted.Should().Be(1);
    }

    [Fact]
    public async Task Weekly_cup_returns_read_only_progress_snapshot()
    {
        var client = await AuthedClientAsync("cup@example.com");
        await client.PostAsJsonAsync("/api/v1/heroes",
            new CreateHeroRequest("Pax", "pax", new() { Domain.Enums.StatName.Strength }));

        var weekKey = DateTime.UtcNow.Date.AddDays(-((int)DateTime.UtcNow.DayOfWeek + 6) % 7).ToString("yyyy-MM-dd");
        var syncRes = await client.PostAsJsonAsync("/api/v1/sync",
            new SyncBatchRequest(null, new()
            {
                new SyncOperation(
                    "cup-settings-1",
                    "hero",
                    "upsert",
                    JsonSerializer.SerializeToElement(new
                    {
                        settings = new
                        {
                            notificationsEnabled = true,
                            hapticEnabled = true,
                            reminderTime = "09:00",
                            aiSkillsEnabled = false,
                            weeklyPath = "power",
                            weeklyPathWeekKey = weekKey,
                            weeklyPathStartedAt = DateTimeOffset.UtcNow.ToString("O"),
                            weeklyRewardWeekKey = (string?)null,
                            weeklyRewardTitle = (string?)null,
                            weeklyRewardBadge = (string?)null,
                        },
                        updatedAt = DateTimeOffset.UtcNow.ToString("O"),
                    }))
            }));
        syncRes.StatusCode.Should().Be(HttpStatusCode.OK);

        var quest1 = await (await client.PostAsJsonAsync("/api/v1/quests",
            new CreateQuestRequest("Deadlift", "", Domain.Enums.QuestType.Side, Domain.Enums.QuestDifficulty.Hard,
                Domain.Enums.StatName.Strength, null))).Content.ReadFromJsonAsync<QuestDto>(Json);
        var quest2 = await (await client.PostAsJsonAsync("/api/v1/quests",
            new CreateQuestRequest("Recovery Walk", "", Domain.Enums.QuestType.Side, Domain.Enums.QuestDifficulty.Medium,
                Domain.Enums.StatName.Vitality, null))).Content.ReadFromJsonAsync<QuestDto>(Json);

        (await client.PostAsync($"/api/v1/quests/{quest1!.Id}/complete", null)).StatusCode.Should().Be(HttpStatusCode.OK);
        (await client.PostAsync($"/api/v1/quests/{quest2!.Id}/complete", null)).StatusCode.Should().Be(HttpStatusCode.OK);

        var cup = await client.GetFromJsonAsync<WeeklyCupDto>("/api/v1/heroes/me/weekly-cup", Json);
        cup!.PathLabel.Should().Be("Power Cup");
        cup.ContractTitle.Should().Be("Power Path");
        cup.CompletedMatches.Should().Be(2);
        cup.Score.Should().BeGreaterThan(0);
        cup.Rank.Should().NotBeNullOrWhiteSpace();
    }
}
