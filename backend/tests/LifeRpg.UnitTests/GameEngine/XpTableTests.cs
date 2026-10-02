using FluentAssertions;
using LifeRpg.Domain.GameConfig;
using LifeRpg.Domain.ValueObjects;
using Xunit;

namespace LifeRpg.UnitTests.GameEngine;

/// <summary>
/// Golden-value tests proving the C# XP curve matches the client's xpTables.ts exactly
/// (floor(14 * level^0.8)). If these drift, client and server disagree on progression.
/// </summary>
public class XpTableTests
{
    [Theory]
    [InlineData(1, 14)]
    [InlineData(2, 24)]
    [InlineData(3, 33)]
    [InlineData(5, 50)]
    [InlineData(10, 88)]
    [InlineData(50, 320)]
    [InlineData(100, 557)]
    public void XpForLevel_matches_client_formula(int level, int expected) =>
        XpTable.XpForLevel(level).Should().Be(expected);

    [Theory]
    [InlineData(0, 0)]
    [InlineData(13, 0)]
    [InlineData(14, 1)]
    [InlineData(37, 1)]
    [InlineData(38, 2)]
    [InlineData(70, 2)]
    [InlineData(71, 3)]
    public void LevelFromXp_matches_client(int totalXp, int expectedLevel) =>
        XpTable.LevelFromXp(totalXp).Should().Be(expectedLevel);

    [Theory]
    [InlineData(1, 14)]
    [InlineData(2, 38)]
    [InlineData(3, 71)]
    [InlineData(5, 163)]
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
    public void ComputeHeroLevel_weights_dominant_stat()
    {
        XpTable.ComputeHeroLevel(new StatBlock(0)).Should().Be(1, "min hero level is 1");
        // Dominant 5, others mean 2.6 -> floor(0.6*5 + 0.4*2.6) = 4.
        var levels = new StatBlock
        {
            Strength = 5, Vitality = 4, Intelligence = 3, Charisma = 3, Dexterity = 2, Willpower = 1,
        };
        XpTable.ComputeHeroLevel(levels).Should().Be(4);

        var specialist = new StatBlock(4) { Strength = 20 };
        XpTable.ComputeHeroLevel(specialist).Should().Be(13);
    }
}
