using LifeRpg.Domain.Enums;

namespace LifeRpg.Domain.GameConfig;

/// <summary>Base XP per quest difficulty. Mirrors the client's DIFFICULTY_XP.</summary>
public static class DifficultyXp
{
    public static int For(QuestDifficulty difficulty) => difficulty switch
    {
        QuestDifficulty.Easy => 15,
        QuestDifficulty.Medium => 25,
        QuestDifficulty.Hard => 50,
        QuestDifficulty.Legendary => 100,
        _ => throw new ArgumentOutOfRangeException(nameof(difficulty)),
    };
}
