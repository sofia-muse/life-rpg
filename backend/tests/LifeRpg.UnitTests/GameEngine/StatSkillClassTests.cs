using FluentAssertions;
using LifeRpg.Domain.Enums;
using LifeRpg.Domain.GameEngine;
using LifeRpg.Domain.ValueObjects;
using Xunit;

namespace LifeRpg.UnitTests.GameEngine;

public class StatCalculatorTests
{
    [Fact]
    public void GetDominantStat_picks_highest_xp_strict_first_on_tie()
    {
        // All equal -> strength wins (first scanned, strict greater-than).
        StatCalculator.GetDominantStat(new StatBlock(500)).Should().Be(StatName.Strength);

        var block = new StatBlock { Intelligence = 1000, Strength = 999 };
        StatCalculator.GetDominantStat(block).Should().Be(StatName.Intelligence);
    }

    [Fact]
    public void CalculateHeroLevel_is_min_one_for_fresh_hero() =>
        StatCalculator.CalculateHeroLevel(new StatBlock(0)).Should().Be(1);

    [Fact]
    public void GetStatLevels_maps_each_stat_xp_to_level()
    {
        var levels = StatCalculator.GetStatLevels(new StatBlock { Strength = 100, Vitality = 0 });
        levels.Strength.Should().Be(1);
        levels.Vitality.Should().Be(0);
    }
}

public class SkillResolverTests
{
    [Fact]
    public void GetNewlyUnlockedSkills_unlocks_first_strength_skill_at_level_3()
    {
        // 901 total XP -> strength level 3 -> unlocks str-1 (req 3) but not str-2 (req 7).
        var statXp = new StatBlock { Strength = 901 };
        var unlocked = SkillResolver.GetNewlyUnlockedSkills(statXp, new HashSet<string>());
        unlocked.Select(s => s.Id).Should().Contain("str-1");
        unlocked.Select(s => s.Id).Should().NotContain(new[] { "str-2", "str-3" });
    }

    [Fact]
    public void GetNewlyUnlockedSkills_skips_already_unlocked()
    {
        var statXp = new StatBlock { Strength = 901 };
        var unlocked = SkillResolver.GetNewlyUnlockedSkills(statXp, new HashSet<string> { "str-1" });
        unlocked.Select(s => s.Id).Should().NotContain("str-1");
    }

    [Fact]
    public void CrossStat_skill_requires_both_stats()
    {
        // Battle Mage (cross-1): strength>=5 AND intelligence>=5.
        var onlyStrength = new StatBlock { Strength = 2819 }; // level 5
        SkillResolver.GetNewlyUnlockedSkills(onlyStrength, new HashSet<string>())
            .Select(s => s.Id).Should().NotContain("cross-1");

        var both = new StatBlock { Strength = 2819, Intelligence = 2819 };
        SkillResolver.GetNewlyUnlockedSkills(both, new HashSet<string>())
            .Select(s => s.Id).Should().Contain("cross-1");
    }

    [Fact]
    public void GetSkillBonusForStat_parses_percent_from_effect()
    {
        // str-1: "+5% XP on Strength quests" -> +5 for strength, 0 for others.
        SkillResolver.GetSkillBonusForStat(StatName.Strength, new[] { "str-1" }).Should().Be(5);
        SkillResolver.GetSkillBonusForStat(StatName.Vitality, new[] { "str-1" }).Should().Be(0);
    }

    [Fact]
    public void ZenMaster_applies_to_all_stats()
    {
        // cross-6: "+3% XP on ALL quests".
        foreach (var stat in Stats.All)
        {
            SkillResolver.GetSkillBonusForStat(stat, new[] { "cross-6" }).Should().Be(3);
        }
    }

    [Fact]
    public void CrossStat_bonus_applies_to_both_required_stats()
    {
        // cross-1 Battle Mage: "+5% XP on STR and INT quests".
        SkillResolver.GetSkillBonusForStat(StatName.Strength, new[] { "cross-1" }).Should().Be(5);
        SkillResolver.GetSkillBonusForStat(StatName.Intelligence, new[] { "cross-1" }).Should().Be(5);
        SkillResolver.GetSkillBonusForStat(StatName.Charisma, new[] { "cross-1" }).Should().Be(0);
    }

    [Fact]
    public void Quest_type_bonuses_use_typed_effect_scopes()
    {
        SkillResolver.GetSkillBonusForQuest(QuestType.Side, StatName.Strength, new[] { "int-2" }).Should().Be(10);
        SkillResolver.GetSkillBonusForQuest(QuestType.Boss, StatName.Charisma, new[] { "cha-2" }).Should().Be(10);
        SkillResolver.GetSkillBonusForQuest(QuestType.Daily, StatName.Charisma, new[] { "cha-2" }).Should().Be(0);
    }

    [Fact]
    public void Daily_lifecycle_skill_effects_are_resolved_without_regex()
    {
        SkillResolver.GetRestDayXpReward(Array.Empty<string>()).Should().Be(10);
        SkillResolver.GetRestDayXpReward(new[] { "vit-1" }).Should().Be(15);
        SkillResolver.GetStreakRetentionRatio(new[] { "vit-2" }).Should().Be(0.5);
        SkillResolver.GetWeeklyStreakFreezeAllowance(new[] { "wil-2" }).Should().Be(1);
        SkillResolver.GetActiveDailyQuestCapacityBonus(new[] { "dex-2" }).Should().Be(2);
    }

    [Fact]
    public void Difficulty_unlocks_gate_hard_and_legendary_per_stat()
    {
        SkillResolver.IsDifficultyAllowed(QuestDifficulty.Medium, StatName.Strength, Array.Empty<string>())
            .Should().BeTrue();
        SkillResolver.IsDifficultyAllowed(QuestDifficulty.Hard, StatName.Strength, Array.Empty<string>())
            .Should().BeFalse();
        SkillResolver.IsDifficultyAllowed(QuestDifficulty.Hard, StatName.Strength, new[] { "str-2" })
            .Should().BeTrue();
        SkillResolver.IsDifficultyAllowed(QuestDifficulty.Legendary, StatName.Strength, new[] { "str-2" })
            .Should().BeFalse();
        SkillResolver.IsDifficultyAllowed(QuestDifficulty.Legendary, StatName.Strength, new[] { "str-3" })
            .Should().BeTrue();
        SkillResolver.IsDifficultyAllowed(QuestDifficulty.Hard, StatName.Vitality, new[] { "str-2" })
            .Should().BeFalse();
    }

    [Fact]
    public void Boss_step_and_weekly_capacity_bonuses_sum_across_skills()
    {
        SkillResolver.GetBossStepXpBonus(new[] { "str-4", "int-4" }).Should().Be(25);
        SkillResolver.GetWeeklyCapacityBonus(new[] { "str-5", "vit-5" }).Should().Be(2);
    }
}

public class ClassResolverTests
{
    [Fact]
    public void TierUp_when_hero_level_crosses_threshold()
    {
        // All stats level 5 -> hero level 5 -> tier 2.
        var statXp = new StatBlock(2819);
        var evo = ClassResolver.CheckClassEvolution(statXp, currentTier: 1, "Apprentice Warrior");
        evo.Should().NotBeNull();
        evo!.NewTier.Should().Be(2);
        evo.OldTier.Should().Be(1);
        evo.NewClass.Should().Be("Warrior");
    }

    [Fact]
    public void DominantStat_shift_changes_class_at_same_tier()
    {
        // Low levels (tier 1) but intelligence dominant -> Apprentice Scholar.
        var statXp = new StatBlock { Intelligence = 200 };
        var evo = ClassResolver.CheckClassEvolution(statXp, currentTier: 1, "Apprentice Warrior");
        evo.Should().NotBeNull();
        evo!.NewTier.Should().Be(1);
        evo.OldTier.Should().Be(1);
        evo.NewClass.Should().Be("Apprentice Scholar");
        evo.DominantStat.Should().Be(StatName.Intelligence);
    }

    [Fact]
    public void No_evolution_when_tier_and_class_unchanged()
    {
        var statXp = new StatBlock { Strength = 200 };
        ClassResolver.CheckClassEvolution(statXp, currentTier: 1, "Apprentice Warrior")
            .Should().BeNull();
    }
}
