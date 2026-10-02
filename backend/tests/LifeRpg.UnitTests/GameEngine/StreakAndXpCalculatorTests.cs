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
    public void Advance_continues_a_quest_streak_only_across_adjacent_days()
    {
        var today = new DateOnly(2026, 6, 4);
        var continued = StreakCalculator.Advance(4, today.AddDays(-1), today, null, 0, 0, missingDateStartsAtOne: true, brokenDayCounts: true);
        continued.Streak.Should().Be(5);

        var broken = StreakCalculator.Advance(4, today.AddDays(-3), today, null, 0, 0, missingDateStartsAtOne: true, brokenDayCounts: true);
        broken.Streak.Should().Be(1);
        broken.UsedFreeze.Should().BeFalse();
    }

    [Fact]
    public void Advance_freeze_keeps_the_chain_and_retention_keeps_half()
    {
        var today = new DateOnly(2026, 6, 4);
        var frozen = StreakCalculator.Advance(9, today.AddDays(-4), today, null, 1, 0);
        frozen.Streak.Should().Be(9);
        frozen.UsedFreeze.Should().BeTrue();
        frozen.LastFreezeDate.Should().Be(today);

        var retained = StreakCalculator.Advance(9, today.AddDays(-4), today, today, 1, 0.5, brokenDayCounts: true);
        retained.Streak.Should().Be(4);
        retained.UsedFreeze.Should().BeFalse();
    }

    [Fact]
    public void Side_boss_budget_pays_twice_then_stops()
    {
        var settings = new LifeRpg.Domain.ValueObjects.HeroSettings();
        var today = new DateOnly(2026, 6, 4);
        BonusPayouts.TryTake(settings, today).Should().BeTrue();
        BonusPayouts.TryTake(settings, today).Should().BeTrue();
        BonusPayouts.TryTake(settings, today).Should().BeFalse();
        BonusPayouts.TryTake(settings, today.AddDays(1)).Should().BeTrue();
    }

    [Fact]
    public void Boss_saga_spends_one_payout_for_every_step()
    {
        var settings = new LifeRpg.Domain.ValueObjects.HeroSettings();
        var today = new DateOnly(2026, 6, 4);
        var boss = Guid.NewGuid();
        BonusPayouts.TryTake(settings, today, boss, isBoss: true).Should().BeTrue();
        BonusPayouts.TryTake(settings, today, boss, isBoss: true).Should().BeTrue();
        settings.BonusPayoutsUsed.Should().Be(1);
        settings.OpenBossPayoutIds.Should().ContainSingle().Which.Should().Be(boss.ToString());

        BonusPayouts.TryTake(settings, today, Guid.NewGuid(), isBoss: false).Should().BeTrue();
        BonusPayouts.TryTake(settings, today, Guid.NewGuid(), isBoss: false).Should().BeFalse();
        settings.BonusPayoutsUsed.Should().Be(2);
    }

    [Fact]
    public void Advance_hero_return_day_counts_as_one()
    {
        var today = new DateOnly(2026, 6, 4);
        var broken = StreakCalculator.Advance(6, today.AddDays(-3), today, null, 0, 0, brokenDayCounts: true);
        broken.Streak.Should().Be(1);
        broken.UsedFreeze.Should().BeFalse();

        var frozen = StreakCalculator.Advance(6, today.AddDays(-3), today, null, 1, 0, brokenDayCounts: true);
        frozen.Streak.Should().Be(6);
        frozen.UsedFreeze.Should().BeTrue();

        var retained = StreakCalculator.Advance(1, today.AddDays(-3), today, today, 1, 0.5, brokenDayCounts: true);
        retained.Streak.Should().Be(1);
        retained.UsedFreeze.Should().BeFalse();
    }

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
        // medium=25, hero x1.2 -> 5, quest x1.5 -> 12, skill 5% -> 1, total=43
        var reward = XpCalculator.CalculateXpReward(QuestDifficulty.Medium, 1.2, 5, 1.5);
        reward.BaseXp.Should().Be(25);
        reward.HeroStreakBonus.Should().Be(5);
        reward.QuestStreakBonus.Should().Be(12);
        reward.StreakBonus.Should().Be(17);
        reward.SkillBonus.Should().Be(1);
        reward.TotalXp.Should().Be(43);
    }

    [Theory]
    [InlineData(0, 1.0)]
    [InlineData(3, 1.05)]
    [InlineData(365, 1.5)]
    [InlineData(400, 1.5)]
    public void Hero_multiplier_caps_at_one_and_a_half(int days, double expected) =>
        StreakCalculator.GetHeroMultiplier(days).Should().Be(expected);

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
        // 13 XP -> level 0; +1 -> 14 XP -> level 1.
        var result = XpCalculator.ApplyXp(13, 1);
        result.NewXp.Should().Be(14);
        result.OldLevel.Should().Be(0);
        result.NewLevel.Should().Be(1);
        result.DidLevelUp.Should().BeTrue();
    }

    [Fact]
    public void ApplyXp_no_level_up_within_level() =>
        XpCalculator.ApplyXp(100, 10).DidLevelUp.Should().BeFalse();
}
