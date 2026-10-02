using LifeRpg.Domain.Enums;
using LifeRpg.Domain.GameConfig;
using LifeRpg.Domain.ValueObjects;

namespace LifeRpg.Domain.GameEngine;

public sealed record ClassEvolution(
    string OldClass,
    string NewClass,
    int OldTier,
    int NewTier,
    StatName DominantStat,
    string Description);

/// <summary>Class tier evolution. Faithful port of the client's classEngine.</summary>
public static class ClassResolver
{
    public static ClassEvolution? CheckClassEvolution(
        StatBlock statXp,
        int currentTier,
        string currentClassName,
        StatName currentDominantStat)
    {
        var heroLevel = StatCalculator.CalculateHeroLevel(statXp);
        var newTier = ClassDefinitions.GetTierForLevel(heroLevel);

        // Class changes automatically only when the tier rises. Same-tier shifts are a player respec.
        if (newTier > currentTier)
        {
            var dominantStat = StatCalculator.ResolveClassStat(statXp, currentDominantStat);
            var classDef = ClassDefinitions.GetClassDefinition(dominantStat, newTier);
            return new ClassEvolution(currentClassName, classDef.Title, currentTier, newTier, dominantStat, classDef.Description);
        }

        return null;
    }

    public static string GetEvolutionNarrative(ClassEvolution evolution) =>
        evolution.NewTier > evolution.OldTier
            ? $"Through dedication and perseverance, the {evolution.OldClass} has evolved into a {evolution.NewClass}! {evolution.Description}"
            : $"The winds of change blow — the hero's path shifts from {evolution.OldClass} to {evolution.NewClass}. {evolution.Description}";
}
