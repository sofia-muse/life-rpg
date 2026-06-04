using FluentAssertions;
using LifeRpg.Domain.Enums;
using LifeRpg.Domain.GameEngine;
using Xunit;

namespace LifeRpg.UnitTests.GameEngine;

public class StreakCalculatorTests
{
    [Theory]
    [InlineData(0, 1.0)]
    [InlineData(2, 1.0)]
    [InlineData(3, 1.1)]
    [InlineData(6, 1.1)]
    [InlineData(7, 1.2)]
    [InlineData(29, 1.3)]
    [InlineData(30, 1.5)]
    [InlineData(400, 3.0)]
    public void GetMultiplier_matches_client_milestones(int streakDays, double expected) =>
        StreakCalculator.GetMultiplier(streakDays).Should().Be(expected);

    [Fact]
    public void ShouldResetStreak_true_only_when_more_than_one_day_missed()
    {
        var today = new DateOnly(2026, 6, 4);
        StreakCalculator.ShouldResetStreak(today, today).Should().BeFalse();
        StreakCalculator.ShouldResetStreak(today.AddDays(-1), today).Should().BeFalse("yesterday is contiguous");
        StreakCalculator.ShouldResetStreak(today.AddDays(-2), today).Should().BeTrue("a day was missed");
    }

    [Theory]
    [InlineData(10, false, 0)]
    [InlineData(10, true, 5)]
    [InlineData(7, true, 3)]
    public void GetStreakAfterBreak_regeneration_keeps_half(int streak, bool regen, int expected) =>
        StreakCalculator.GetStreakAfterBreak(streak, regen).Should().Be(expected);

    [Fact]
    public void NextMilestone_after_last_is_null()
    {
        StreakCalculator.GetNextMilestone(400).Should().BeNull();
        StreakCalculator.GetNextMilestone(0)!.Days.Should().Be(3);
    }
}

public class XpCalculatorTests
{
    [Fact]
    public void CalculateXpReward_sums_base_streak_and_skill_bonus()
    {
        // medium=25, streak x1.2 -> floor(25*0.2)=4, skill 5% -> floor(25*0.05)=1, total=30
        var reward = XpCalculator.CalculateXpReward(QuestDifficulty.Medium, 1.2, 5);
        reward.BaseXp.Should().Be(25);
        reward.StreakBonus.Should().Be(4);
        reward.SkillBonus.Should().Be(1);
        reward.TotalXp.Should().Be(30);
    }

    [Fact]
    public void CalculateXpReward_no_bonuses_is_base()
    {
        var reward = XpCalculator.CalculateXpReward(QuestDifficulty.Legendary, 1.0);
        reward.TotalXp.Should().Be(100);
        reward.StreakBonus.Should().Be(0);
    }

    [Fact]
    public void ApplyXp_detects_level_up_across_threshold()
    {
        // 99 XP -> level 0; +1 -> 100 XP -> level 1.
        var result = XpCalculator.ApplyXp(99, 1);
        result.NewXp.Should().Be(100);
        result.OldLevel.Should().Be(0);
        result.NewLevel.Should().Be(1);
        result.DidLevelUp.Should().BeTrue();
    }

    [Fact]
    public void ApplyXp_no_level_up_within_level() =>
        XpCalculator.ApplyXp(100, 10).DidLevelUp.Should().BeFalse();
}
