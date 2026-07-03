using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using LifeRpg.Application.Dtos;
using Xunit;

namespace LifeRpg.IntegrationTests;

public class SyncTests : IClassFixture<LifeRpgApiFactory>
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter(System.Text.Json.JsonNamingPolicy.CamelCase) },
    };
    private readonly LifeRpgApiFactory _factory;

    public SyncTests(LifeRpgApiFactory factory) => _factory = factory;

    private async Task<HttpClient> AuthedHeroClientAsync(string email)
    {
        var client = _factory.CreateClient();
        var auth = await (await client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest(email, "Passw0rd!23", "Tester"))).Content.ReadFromJsonAsync<AuthResponse>(Json);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.AccessToken);
        await client.PostAsJsonAsync("/api/v1/heroes",
            new CreateHeroRequest("Syncer", "s", new() { Domain.Enums.StatName.Dexterity }));
        return client;
    }

    [Fact]
    public async Task Sync_batch_is_idempotent_on_replay()
    {
        var client = await AuthedHeroClientAsync("sync@example.com");

        var quest = new
        {
            id = Guid.NewGuid(),
            title = "Offline quest",
            description = "created offline",
            type = "side",
            difficulty = "medium",
            stat = "dexterity",
            isActive = true,
        };
        var op = new
        {
            opId = "op-123",
            entity = "quest",
            action = "upsert",
            payload = quest,
        };
        var batch = new { lastSyncedAt = (DateTimeOffset?)null, operations = new[] { op } };

        // First apply.
        var first = await (await client.PostAsJsonAsync("/api/v1/sync", batch))
            .Content.ReadFromJsonAsync<SyncBatchResult>(Json);
        first!.Applied.Should().ContainSingle().Which.Should().Be("op-123");
        first.Skipped.Should().BeEmpty();

        // Replay the exact same batch — must be a no-op (idempotent).
        var second = await (await client.PostAsJsonAsync("/api/v1/sync", batch))
            .Content.ReadFromJsonAsync<SyncBatchResult>(Json);
        second!.Applied.Should().BeEmpty("the op was already applied");
        second.Skipped.Should().ContainSingle().Which.Should().Be("op-123");

        // The quest exists exactly once.
        var quests = await client.GetFromJsonAsync<List<QuestDto>>("/api/v1/quests", Json);
        quests!.Count(q => q.Title == "Offline quest").Should().Be(1);
    }

    [Fact]
    public async Task Sync_rejects_stale_quest_overwrites()
    {
        var client = await AuthedHeroClientAsync("sync-stale@example.com");
        var questId = Guid.NewGuid();
        var createdAt = DateTimeOffset.UtcNow.AddMinutes(-10);
        var freshUpdatedAt = DateTimeOffset.UtcNow.AddMinutes(-1);
        var staleUpdatedAt = DateTimeOffset.UtcNow.AddMinutes(-5);

        var createBatch = new
        {
            lastSyncedAt = (DateTimeOffset?)null,
            operations = new[]
            {
                new
                {
                    opId = "op-create",
                    entity = "quest",
                    action = "upsert",
                    payload = new
                    {
                        id = questId,
                        title = "Original",
                        description = "",
                        type = "side",
                        difficulty = "easy",
                        stat = "dexterity",
                        isCompleted = false,
                        isActive = true,
                        createdAt,
                        updatedAt = createdAt,
                    }
                }
            }
        };

        var freshBatch = new
        {
            lastSyncedAt = (DateTimeOffset?)null,
            operations = new[]
            {
                new
                {
                    opId = "op-fresh",
                    entity = "quest",
                    action = "upsert",
                    payload = new
                    {
                        id = questId,
                        title = "Fresh title",
                        description = "",
                        type = "side",
                        difficulty = "easy",
                        stat = "dexterity",
                        isCompleted = false,
                        isActive = true,
                        createdAt,
                        updatedAt = freshUpdatedAt,
                    }
                }
            }
        };

        var staleBatch = new
        {
            lastSyncedAt = (DateTimeOffset?)null,
            operations = new[]
            {
                new
                {
                    opId = "op-stale",
                    entity = "quest",
                    action = "upsert",
                    payload = new
                    {
                        id = questId,
                        title = "Stale title",
                        description = "",
                        type = "side",
                        difficulty = "easy",
                        stat = "dexterity",
                        isCompleted = false,
                        isActive = true,
                        createdAt,
                        updatedAt = staleUpdatedAt,
                    }
                }
            }
        };

        await client.PostAsJsonAsync("/api/v1/sync", createBatch);
        await client.PostAsJsonAsync("/api/v1/sync", freshBatch);
        var stale = await (await client.PostAsJsonAsync("/api/v1/sync", staleBatch))
            .Content.ReadFromJsonAsync<SyncBatchResult>(Json);

        stale!.Conflicts.Should().ContainSingle();
        stale.Conflicts[0].OpId.Should().Be("op-stale");

        var quests = await client.GetFromJsonAsync<List<QuestDto>>("/api/v1/quests", Json);
        quests!.Single(q => q.Id == questId).Title.Should().Be("Fresh title");
    }
}
