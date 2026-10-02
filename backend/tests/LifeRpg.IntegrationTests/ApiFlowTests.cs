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
        firstStep!.Completion.Should().NotBeNull();
        firstStep.Completion!.XpAwarded.Should().Be(25);
        firstStep.Quest.CompletedSteps.Should().Be(1);
        firstStep.Quest.IsCompleted.Should().BeFalse();
        firstStep.Completion.Hero.TotalQuestsCompleted.Should().Be(0);

        var secondStep = await (await client.PostAsync($"/api/v1/quests/{quest.Id}/boss-step", null))
            .Content.ReadFromJsonAsync<AdvanceBossQuestResult>(Json);
        secondStep!.Completion.Should().NotBeNull();
        // Step 1 crosses charisma into level 3 and unlocks Silver Tongue (+5% of 50 = 2).
        // The closing step keeps the remainder of that 52 XP reward: 52 - 26 = 26.
        secondStep.Completion!.XpAwarded.Should().Be(26);
        secondStep.Quest.CompletedSteps.Should().Be(2);
        secondStep.Quest.IsCompleted.Should().BeTrue();
        secondStep.Completion!.Hero.TotalQuestsCompleted.Should().Be(1);
        secondStep.Completion.Hero.StatXp.Charisma.Should().Be(101);
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
        cup.Completions.Should().HaveCount(2);
        cup.Score.Should().BeGreaterThan(0);
        cup.Rank.Should().NotBeNullOrWhiteSpace();

        var hydrated = await client.GetFromJsonAsync<HeroDto>("/api/v1/heroes/me", Json);
        hydrated!.RecentCompletions.Should().HaveCount(2);
    }

    [Fact]
    public async Task Third_side_quest_in_a_day_completes_without_xp()
    {
        var client = await AuthedClientAsync("budget@example.com");
        await client.PostAsJsonAsync("/api/v1/heroes",
            new CreateHeroRequest("Bud", "bud", new() { Domain.Enums.StatName.Strength }));

        async Task<int> CompleteSide(string title)
        {
            var quest = await (await client.PostAsJsonAsync("/api/v1/quests",
                new CreateQuestRequest(title, "", Domain.Enums.QuestType.Side, Domain.Enums.QuestDifficulty.Easy,
                    Domain.Enums.StatName.Strength, null))).Content.ReadFromJsonAsync<QuestDto>(Json);
            var result = await (await client.PostAsync($"/api/v1/quests/{quest!.Id}/complete", null))
                .Content.ReadFromJsonAsync<CompleteQuestResult>(Json);
            result!.Hero.TotalQuestsCompleted.Should().BeGreaterThan(0);
            return result.XpAwarded;
        }

        (await CompleteSide("One")).Should().Be(15);
        (await CompleteSide("Two")).Should().Be(15);
        var third = await (await client.PostAsJsonAsync("/api/v1/quests",
            new CreateQuestRequest("Three", "", Domain.Enums.QuestType.Side, Domain.Enums.QuestDifficulty.Easy,
                Domain.Enums.StatName.Strength, null))).Content.ReadFromJsonAsync<QuestDto>(Json);
        var denied = await (await client.PostAsync($"/api/v1/quests/{third!.Id}/complete", null))
            .Content.ReadFromJsonAsync<CompleteQuestResult>(Json);
        denied!.XpAwarded.Should().Be(0);
        denied.BonusBudgetSpent.Should().BeTrue();
        denied.Hero.TotalQuestsCompleted.Should().Be(3);
    }

    [Fact]
    public async Task Boss_saga_consumes_one_daily_payout()
    {
        var client = await AuthedClientAsync("boss-budget@example.com");
        await client.PostAsJsonAsync("/api/v1/heroes",
            new CreateHeroRequest("Saga", "saga", new() { Domain.Enums.StatName.Strength }));

        var boss = await (await client.PostAsJsonAsync("/api/v1/quests",
            new CreateQuestRequest("Long climb", "", Domain.Enums.QuestType.Boss, Domain.Enums.QuestDifficulty.Easy,
                Domain.Enums.StatName.Strength, 3))).Content.ReadFromJsonAsync<QuestDto>(Json);

        var first = await (await client.PostAsync($"/api/v1/quests/{boss!.Id}/boss-step", null))
            .Content.ReadFromJsonAsync<AdvanceBossQuestResult>(Json);
        first!.Completion!.XpAwarded.Should().BeGreaterThan(0);
        first.Completion.BonusBudgetSpent.Should().BeFalse();
        first.Completion.Hero.Settings.BonusPayoutsUsed.Should().Be(1);

        var second = await (await client.PostAsync($"/api/v1/quests/{boss.Id}/boss-step", null))
            .Content.ReadFromJsonAsync<AdvanceBossQuestResult>(Json);
        second!.Completion!.XpAwarded.Should().BeGreaterThan(0);
        second.Completion.Hero.Settings.BonusPayoutsUsed.Should().Be(1);
        second.Quest.IsCompleted.Should().BeFalse();

        var side = await (await client.PostAsJsonAsync("/api/v1/quests",
            new CreateQuestRequest("Cool down", "", Domain.Enums.QuestType.Side, Domain.Enums.QuestDifficulty.Easy,
                Domain.Enums.StatName.Strength, null))).Content.ReadFromJsonAsync<QuestDto>(Json);
        var sideResult = await (await client.PostAsync($"/api/v1/quests/{side!.Id}/complete", null))
            .Content.ReadFromJsonAsync<CompleteQuestResult>(Json);
        sideResult!.XpAwarded.Should().Be(15);
        sideResult.BonusBudgetSpent.Should().BeFalse();

        var extra = await (await client.PostAsJsonAsync("/api/v1/quests",
            new CreateQuestRequest("One more", "", Domain.Enums.QuestType.Side, Domain.Enums.QuestDifficulty.Easy,
                Domain.Enums.StatName.Strength, null))).Content.ReadFromJsonAsync<QuestDto>(Json);
        var extraResult = await (await client.PostAsync($"/api/v1/quests/{extra!.Id}/complete", null))
            .Content.ReadFromJsonAsync<CompleteQuestResult>(Json);
        extraResult!.XpAwarded.Should().Be(0);
        extraResult.BonusBudgetSpent.Should().BeTrue();
        extraResult.Hero.TotalQuestsCompleted.Should().Be(2);
    }

    [Fact]
    public async Task Hero_upsert_ignores_client_xp_and_streak()
    {
        var client = await AuthedClientAsync("sync-xp@example.com");
        await client.PostAsJsonAsync("/api/v1/heroes",
            new CreateHeroRequest("Sync", "sync", new() { Domain.Enums.StatName.Strength }));

        var quest = await (await client.PostAsJsonAsync("/api/v1/quests",
            new CreateQuestRequest("Deadlift", "", Domain.Enums.QuestType.Side, Domain.Enums.QuestDifficulty.Hard,
                Domain.Enums.StatName.Strength, null))).Content.ReadFromJsonAsync<QuestDto>(Json);
        (await client.PostAsync($"/api/v1/quests/{quest!.Id}/complete", null)).StatusCode.Should().Be(HttpStatusCode.OK);

        var syncRes = await client.PostAsJsonAsync("/api/v1/sync",
            new SyncBatchRequest(null, new()
            {
                new SyncOperation(
                    "sync-xp-1",
                    "hero",
                    "upsert",
                    JsonSerializer.SerializeToElement(new
                    {
                        name = "Renamed",
                        statXp = new { strength = 9999, vitality = 0, intelligence = 0, charisma = 0, dexterity = 0, willpower = 0 },
                        currentStreak = 40,
                        longestStreak = 80,
                        lastActiveDate = "1999-01-01",
                        lastStreakFreezeDate = "1999-01-02",
                        updatedAt = DateTimeOffset.UtcNow.AddHours(1).ToString("O"),
                    }))
            }));
        syncRes.StatusCode.Should().Be(HttpStatusCode.OK);

        var persisted = await client.GetFromJsonAsync<HeroDto>("/api/v1/heroes/me", Json);
        persisted!.Name.Should().Be("Renamed");
        persisted.StatXp.Strength.Should().Be(100);
        persisted.CurrentStreak.Should().Be(1);
        persisted.LongestStreak.Should().Be(1);
        persisted.LastActiveDate.Should().NotBe(new DateOnly(1999, 1, 1));
        persisted.LastStreakFreezeDate.Should().BeNull();
    }

    [Fact]
    public async Task Rest_and_respec_are_server_commands()
    {
        var client = await AuthedClientAsync("rest@example.com");
        await client.PostAsJsonAsync("/api/v1/heroes",
            new CreateHeroRequest("Rin", "rin", new() { Domain.Enums.StatName.Strength }));

        var rested = await (await client.PostAsync("/api/v1/heroes/me/rest", null))
            .Content.ReadFromJsonAsync<HeroDto>(Json);
        rested!.CurrentStreak.Should().Be(1);
        rested.StatXp.Vitality.Should().BeGreaterThan(0);
        rested.RestDaysUsed.Should().Be(1);

        var again = await (await client.PostAsync("/api/v1/heroes/me/rest", null))
            .Content.ReadFromJsonAsync<HeroDto>(Json);
        again!.StatXp.Vitality.Should().Be(rested.StatXp.Vitality);
        again.RestDaysUsed.Should().Be(1);

        var respec = await (await client.PostAsJsonAsync("/api/v1/heroes/me/respec",
            new RespecRequest(Domain.Enums.StatName.Intelligence))).Content.ReadFromJsonAsync<HeroDto>(Json);
        respec!.DominantStat.Should().Be(Domain.Enums.StatName.Intelligence);
        respec.ClassName.Should().Be("Apprentice Scholar");
        respec.ClassTier.Should().Be(1);
    }

    [Fact]
    public async Task Quest_sync_creates_the_shell_and_ignores_completion()
    {
        var client = await AuthedClientAsync("shell@example.com");
        await client.PostAsJsonAsync("/api/v1/heroes",
            new CreateHeroRequest("Shell", "shell", new() { Domain.Enums.StatName.Strength }));

        var created = (await (await client.PostAsJsonAsync("/api/v1/quests",
            new CreateQuestRequest("Existing", "", Domain.Enums.QuestType.Side, Domain.Enums.QuestDifficulty.Easy,
                Domain.Enums.StatName.Strength, null))).Content.ReadFromJsonAsync<QuestDto>(Json))!;

        var insertedId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;
        var syncRes = await client.PostAsJsonAsync("/api/v1/sync",
            new SyncBatchRequest(null, new()
            {
                new SyncOperation(
                    "shell-insert",
                    "quest",
                    "upsert",
                    JsonSerializer.SerializeToElement(new
                    {
                        id = insertedId,
                        title = "Forged finish",
                        description = "",
                        type = "side",
                        difficulty = "easy",
                        stat = "strength",
                        isActive = true,
                        isCompleted = true,
                        completedAt = now.ToString("O"),
                        completedSteps = 4,
                        streak = 9,
                        daysCompleted = 9,
                        createdAt = now.ToString("O"),
                        updatedAt = now.ToString("O"),
                    })),
                new SyncOperation(
                    "shell-update",
                    "quest",
                    "upsert",
                    JsonSerializer.SerializeToElement(new
                    {
                        id = created.Id,
                        title = "Existing",
                        description = "",
                        type = "side",
                        difficulty = "easy",
                        stat = "strength",
                        isActive = true,
                        isCompleted = true,
                        completedAt = now.ToString("O"),
                        completedSteps = 4,
                        streak = 9,
                        daysCompleted = 9,
                        updatedAt = now.AddMinutes(5).ToString("O"),
                    })),
            }));
        syncRes.StatusCode.Should().Be(HttpStatusCode.OK);

        var quests = (await client.GetFromJsonAsync<List<QuestDto>>("/api/v1/quests", Json))!;
        var inserted = quests.Single(q => q.Id == insertedId);
        inserted.IsCompleted.Should().BeFalse();
        inserted.CompletedAt.Should().BeNull();
        inserted.CompletedSteps.Should().BeNull();
        inserted.Streak.Should().Be(0);
        inserted.DaysCompleted.Should().Be(0);

        var updated = quests.Single(q => q.Id == created.Id);
        updated.IsCompleted.Should().BeFalse();
        updated.CompletedAt.Should().BeNull();
        updated.CompletedSteps.Should().BeNull();
        updated.Streak.Should().Be(0);
        updated.DaysCompleted.Should().Be(0);
    }

    [Fact]
    public async Task Fourth_daily_pays_nothing_after_a_finished_daily_is_deleted()
    {
        var client = await AuthedClientAsync("daily-cap@example.com");
        await client.PostAsJsonAsync("/api/v1/heroes",
            new CreateHeroRequest("Day", "day", new() { Domain.Enums.StatName.Strength }));

        async Task<CompleteQuestResult> CompleteDaily(string title)
        {
            var quest = await (await client.PostAsJsonAsync("/api/v1/quests",
                new CreateQuestRequest(title, "", Domain.Enums.QuestType.Daily, Domain.Enums.QuestDifficulty.Easy,
                    Domain.Enums.StatName.Strength, null))).Content.ReadFromJsonAsync<QuestDto>(Json);
            return (await (await client.PostAsync($"/api/v1/quests/{quest!.Id}/complete", null))
                .Content.ReadFromJsonAsync<CompleteQuestResult>(Json))!;
        }

        var first = await CompleteDaily("One");
        var second = await CompleteDaily("Two");
        var third = await CompleteDaily("Three");
        first.XpAwarded.Should().Be(15);
        second.XpAwarded.Should().Be(15);
        third.XpAwarded.Should().Be(15);

        var quests = await client.GetFromJsonAsync<List<QuestDto>>("/api/v1/quests", Json);
        var finished = quests!.Single(q => q.Title == "Three");
        (await client.DeleteAsync($"/api/v1/quests/{finished.Id}")).StatusCode.Should().Be(HttpStatusCode.NoContent);

        var fourth = await CompleteDaily("Four");
        fourth.XpAwarded.Should().Be(0);
        fourth.BonusBudgetSpent.Should().BeTrue();
        fourth.Hero.Settings.DailyXpPayoutsUsed.Should().Be(3);
        var after = await client.GetFromJsonAsync<List<QuestDto>>("/api/v1/quests", Json);
        after!.Single(q => q.Title == "Four").IsCompleted.Should().BeTrue();
    }

    [Fact]
    public async Task Hero_upsert_ignores_rest_class_and_weekly_reward()
    {
        var client = await AuthedClientAsync("sealed@example.com");
        await client.PostAsJsonAsync("/api/v1/heroes",
            new CreateHeroRequest("Seal", "seal", new() { Domain.Enums.StatName.Strength }));

        var rested = await (await client.PostAsync("/api/v1/heroes/me/rest", null))
            .Content.ReadFromJsonAsync<HeroDto>(Json);
        rested!.Settings.RecentRestDates.Should().NotBeEmpty();
        var restDates = rested.Settings.RecentRestDates;

        var syncRes = await client.PostAsJsonAsync("/api/v1/sync",
            new SyncBatchRequest(null, new()
            {
                new SyncOperation(
                    "sealed-hero",
                    "hero",
                    "upsert",
                    JsonSerializer.SerializeToElement(new
                    {
                        dominantStat = "intelligence",
                        recentRestDates = Array.Empty<string>(),
                        settings = new
                        {
                            notificationsEnabled = true,
                            hapticEnabled = true,
                            reminderTime = "09:00",
                            aiSkillsEnabled = false,
                            recentRestDates = Array.Empty<string>(),
                            weeklyRewardWeekKey = "2099-01-05",
                            weeklyRewardTitle = "Stolen",
                            weeklyRewardBadge = "Stolen Cup",
                            dailyXpDate = "2099-01-05",
                            dailyXpPayoutsUsed = 0,
                        },
                        updatedAt = DateTimeOffset.UtcNow.AddHours(1).ToString("O"),
                    }))
            }));
        syncRes.StatusCode.Should().Be(HttpStatusCode.OK);

        var persisted = await client.GetFromJsonAsync<HeroDto>("/api/v1/heroes/me", Json);
        persisted!.DominantStat.Should().Be(Domain.Enums.StatName.Strength);
        persisted.ClassName.Should().Be("Apprentice Warrior");
        persisted.Settings.RecentRestDates.Should().BeEquivalentTo(restDates);
        persisted.Settings.WeeklyRewardWeekKey.Should().BeNull();
        persisted.Settings.WeeklyRewardTitle.Should().BeNull();
        persisted.Settings.WeeklyRewardBadge.Should().BeNull();
        persisted.Settings.DailyXpDate.Should().BeNull();
        persisted.Settings.DailyXpPayoutsUsed.Should().Be(0);
    }

    [Fact]
    public async Task Weekly_reward_is_claimed_only_when_the_contract_is_complete()
    {
        var client = await AuthedClientAsync("claim@example.com");
        await client.PostAsJsonAsync("/api/v1/heroes",
            new CreateHeroRequest("Claim", "claim", new() { Domain.Enums.StatName.Strength }));

        var weekKey = DateTime.UtcNow.Date.AddDays(-((int)DateTime.UtcNow.DayOfWeek + 6) % 7).ToString("yyyy-MM-dd");
        var syncRes = await client.PostAsJsonAsync("/api/v1/sync",
            new SyncBatchRequest(null, new()
            {
                new SyncOperation(
                    "claim-path",
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
                        },
                        updatedAt = DateTimeOffset.UtcNow.ToString("O"),
                    }))
            }));
        syncRes.StatusCode.Should().Be(HttpStatusCode.OK);

        var early = await client.PostAsync("/api/v1/heroes/me/weekly-reward", null);
        early.StatusCode.Should().Be(HttpStatusCode.Conflict);

        async Task Complete(string title, Domain.Enums.QuestType type, Domain.Enums.StatName stat)
        {
            var quest = await (await client.PostAsJsonAsync("/api/v1/quests",
                new CreateQuestRequest(title, "", type, Domain.Enums.QuestDifficulty.Easy, stat, null)))
                .Content.ReadFromJsonAsync<QuestDto>(Json);
            (await client.PostAsync($"/api/v1/quests/{quest!.Id}/complete", null)).StatusCode.Should().Be(HttpStatusCode.OK);
        }

        await Complete("Lift", Domain.Enums.QuestType.Side, Domain.Enums.StatName.Strength);
        await Complete("Walk", Domain.Enums.QuestType.Side, Domain.Enums.StatName.Vitality);
        await Complete("Push", Domain.Enums.QuestType.Daily, Domain.Enums.StatName.Strength);
        await Complete("Stretch", Domain.Enums.QuestType.Daily, Domain.Enums.StatName.Vitality);

        var claimed = await (await client.PostAsync("/api/v1/heroes/me/weekly-reward", null))
            .Content.ReadFromJsonAsync<HeroDto>(Json);
        claimed!.Settings.WeeklyRewardWeekKey.Should().Be(weekKey);
        claimed.Settings.WeeklyRewardTitle.Should().Be("Vanguard of Power");
        claimed.Settings.WeeklyRewardBadge.Should().Be("Power Cup");

        var again = await (await client.PostAsync("/api/v1/heroes/me/weekly-reward", null))
            .Content.ReadFromJsonAsync<HeroDto>(Json);
        again!.Settings.WeeklyRewardWeekKey.Should().Be(weekKey);
        again.Settings.WeeklyRewardTitle.Should().Be("Vanguard of Power");
    }
}
