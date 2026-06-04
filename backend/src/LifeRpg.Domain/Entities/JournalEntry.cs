using LifeRpg.Domain.Common;
using LifeRpg.Domain.ValueObjects;

namespace LifeRpg.Domain.Entities;

public class JournalEntry : Entity
{
    public Guid HeroId { get; set; }
    public Hero? Hero { get; set; }

    /// <summary>Calendar day this entry summarizes (one entry per hero per day).</summary>
    public DateOnly Date { get; set; }

    public string Narrative { get; set; } = string.Empty;
    public int QuestsCompleted { get; set; }
    public int SkillsUnlocked { get; set; }

    // JSON columns.
    public StatBlock XpGained { get; set; } = new(0);
    public List<string> LevelsGained { get; set; } = new();
    public List<string> Milestones { get; set; } = new();
}
