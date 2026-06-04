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
        string currentClassName)
    {
        var heroLevel = StatCalculator.CalculateHeroLevel(statXp);
        var dominantStat = StatCalculator.GetDominantStat(statXp);
        var newTier = ClassDefinitions.GetTierForLevel(heroLevel);

        // Tier up.
        if (newTier > currentTier)
        {
            var classDef = ClassDefinitions.GetClassDefinition(dominantStat, newTier);
            return new ClassEvolution(currentClassName, classDef.Title, currentTier, newTier, dominantStat, classDef.Description);
        }

        // Dominant stat shift at the same tier (new class, same tier).
        var newClassName = ClassDefinitions.GetClassName(dominantStat, currentTier);
        if (newClassName != currentClassName)
        {
            var classDef = ClassDefinitions.GetClassDefinition(dominantStat, currentTier);
            return new ClassEvolution(
                currentClassName,
                classDef.Title,
                currentTier,
                currentTier,
                dominantStat,
                $"Your focus has shifted — you are now a {classDef.Title}!");
        }

        return null;
    }

    public static string GetEvolutionNarrative(ClassEvolution evolution) =>
        evolution.NewTier > evolution.OldTier
            ? $"Through dedication and perseverance, the {evolution.OldClass} has evolved into a {evolution.NewClass}! {evolution.Description}"
            : $"The winds of change blow — the hero's path shifts from {evolution.OldClass} to {evolution.NewClass}. {evolution.Description}";
}
