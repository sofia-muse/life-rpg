using LifeRpg.Domain.Common;
using LifeRpg.Domain.Enums;

namespace LifeRpg.Domain.Entities;

public class Quest : Entity
{
    public Guid HeroId { get; set; }
    public Hero? Hero { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public QuestType Type { get; set; }
    public QuestDifficulty Difficulty { get; set; }
    public StatName Stat { get; set; }
    public int XpReward { get; set; }

    public bool IsCompleted { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset? CompletedAt { get; set; }

    public int Streak { get; set; }
    public int BestStreak { get; set; }
    public int DaysCompleted { get; set; }

    // Boss quests only.
    public int? TotalSteps { get; set; }
    public int? CompletedSteps { get; set; }

    public byte[] RowVersion { get; set; } = Array.Empty<byte>();
}
