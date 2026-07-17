using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using LifeRpg.Application.Dtos;
using LifeRpg.Domain.Enums;
using Xunit;

namespace LifeRpg.IntegrationTests;

public class RaidTests : IClassFixture<LifeRpgApiFactory>
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter(System.Text.Json.JsonNamingPolicy.CamelCase) },
    };

    private readonly LifeRpgApiFactory _factory;
    private readonly HttpClient _client;

    public RaidTests(LifeRpgApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<(HttpClient Client, HeroDto Hero)> AuthedHeroAsync(string email, string name)
    {
        var res = await _client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequest(email, "Passw0rd!23", name));
        res.StatusCode.Should().Be(HttpStatusCode.OK);
        var auth = await res.Content.ReadFromJsonAsync<AuthResponse>(Json);
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.AccessToken);

        var heroRes = await client.PostAsJsonAsync("/api/v1/heroes",
            new CreateHeroRequest(name, name.ToLowerInvariant(), new() { StatName.Strength }));
        heroRes.StatusCode.Should().Be(HttpStatusCode.OK);
        var hero = await heroRes.Content.ReadFromJsonAsync<HeroDto>(Json);
        return (client, hero!);
    }

    [Fact]
    public async Task Create_join_contribute_completes_raid_and_tracks_personal_totals()
    {
        var (leader, _) = await AuthedHeroAsync("raid-leader@example.com", "Kael");
        var (member, _) = await AuthedHeroAsync("raid-member@example.com", "Lyra");

        var createRes = await leader.PostAsJsonAsync("/api/v1/raids", new CreateRaidRequest(
            Title: "Iron Legion Push",
            Description: "Pool 100 push-ups as a party.",
            SagaTitle: "The Iron Legion's Trial",
            RewardTitle: "Iron Cohort",
            UnitLabel: "push-ups",
            TargetAmount: 100,
            Stat: StatName.Strength,
            MaxMembers: 4,
            Deadline: null));
        createRes.StatusCode.Should().Be(HttpStatusCode.OK);
        var raid = await createRes.Content.ReadFromJsonAsync<RaidDto>(Json);
        raid!.InviteCode.Should().NotBeNullOrWhiteSpace();
        raid.MemberCount.Should().Be(1);
        raid.YourContribution.Should().Be(0);

        var joinRes = await member.PostAsJsonAsync("/api/v1/raids/join", new JoinRaidRequest(raid.InviteCode));
        joinRes.StatusCode.Should().Be(HttpStatusCode.OK);
        var joined = await joinRes.Content.ReadFromJsonAsync<RaidDto>(Json);
        joined!.MemberCount.Should().Be(2);

        var contrib1 = await leader.PostAsJsonAsync($"/api/v1/raids/{raid.Id}/contribute",
            new ContributeRaidRequest(40, Guid.NewGuid().ToString(), "Morning set"));
        contrib1.StatusCode.Should().Be(HttpStatusCode.OK);

        // Idempotent replay with same client id
        var clientId = Guid.NewGuid().ToString();
        var first = await member.PostAsJsonAsync($"/api/v1/raids/{raid.Id}/contribute",
            new ContributeRaidRequest(30, clientId, null));
        first.StatusCode.Should().Be(HttpStatusCode.OK);
        var replay = await member.PostAsJsonAsync($"/api/v1/raids/{raid.Id}/contribute",
            new ContributeRaidRequest(30, clientId, null));
        replay.StatusCode.Should().Be(HttpStatusCode.OK);
        var afterReplay = await replay.Content.ReadFromJsonAsync<ContributeRaidResult>(Json);
        afterReplay!.Raid.CurrentAmount.Should().Be(70, "replay must not double-count");

        var finish = await leader.PostAsJsonAsync($"/api/v1/raids/{raid.Id}/contribute",
            new ContributeRaidRequest(40, Guid.NewGuid().ToString(), "Finisher"));
        finish.StatusCode.Should().Be(HttpStatusCode.OK);
        var done = await finish.Content.ReadFromJsonAsync<ContributeRaidResult>(Json);
        done!.JustCompleted.Should().BeTrue();
        done.Raid.IsCompleted.Should().BeTrue();
        done.Raid.CurrentAmount.Should().BeGreaterThanOrEqualTo(100);
        done.Raid.YourContribution.Should().Be(80);
        done.Raid.Members.Single(m => m.HeroName == "Lyra").PersonalTotal.Should().Be(30);

        var list = await leader.GetFromJsonAsync<List<RaidDto>>("/api/v1/raids", Json);
        list.Should().ContainSingle(r => r.Id == raid.Id && r.IsCompleted);
    }

    [Fact]
    public async Task Raids_require_auth()
    {
        var res = await _client.GetAsync("/api/v1/raids");
        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
