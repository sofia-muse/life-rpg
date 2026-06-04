using FluentAssertions;
using LifeRpg.Domain.GameConfig;
using LifeRpg.Domain.ValueObjects;
using Xunit;

namespace LifeRpg.UnitTests.GameEngine;

/// <summary>
/// Golden-value tests proving the C# XP curve matches the client's xpTables.ts exactly
/// (baseXP * level^1.5, floored). If these drift, client and server disagree on progression.
/// </summary>
public class XpTableTests
{
    [Theory]
    [InlineData(1, 100)]
    [InlineData(2, 282)]
    [InlineData(3, 519)]
    [InlineData(5, 1118)]
    [InlineData(10, 3162)]
    [InlineData(50, 35355)]
    [InlineData(100, 100000)]
    public void XpForLevel_matches_client_formula(int level, int expected) =>
        XpTable.XpForLevel(level).Should().Be(expected);

    [Theory]
    [InlineData(0, 0)]
    [InlineData(50, 0)]
    [InlineData(99, 0)]
    [InlineData(100, 1)]
    [InlineData(382, 2)]
    [InlineData(1000, 3)]
    [InlineData(5000, 6)]
    public void LevelFromXp_matches_client(int totalXp, int expectedLevel) =>
        XpTable.LevelFromXp(totalXp).Should().Be(expectedLevel);

    [Theory]
    [InlineData(1, 100)]
    [InlineData(2, 382)]
    [InlineData(3, 901)]
    [InlineData(5, 2819)]
    public void TotalXpForLevel_matches_client(int level, int expected) =>
        XpTable.TotalXpForLevel(level).Should().Be(expected);

    [Fact]
    public void LevelFromXp_is_monotonic_and_clamps_to_max()
    {
        var prev = 0;
        for (var xp = 0; xp < 2_000_000; xp += 5000)
        {
            var level = XpTable.LevelFromXp(xp);
            level.Should().BeGreaterThanOrEqualTo(prev);
            level.Should().BeLessThanOrEqualTo(XpTable.MaxLevel);
            prev = level;
        }
        XpTable.LevelFromXp(int.MaxValue).Should().Be(XpTable.MaxLevel);
    }

    [Fact]
    public void ComputeHeroLevel_is_floored_average_min_one()
    {
        XpTable.ComputeHeroLevel(new StatBlock(0)).Should().Be(1, "min hero level is 1");
        // Levels summing to 18 across 6 stats -> floor(18/6) = 3.
        var levels = new StatBlock
        {
            Strength = 5, Vitality = 4, Intelligence = 3, Charisma = 3, Dexterity = 2, Willpower = 1,
        };
        XpTable.ComputeHeroLevel(levels).Should().Be(3);
    }
}
