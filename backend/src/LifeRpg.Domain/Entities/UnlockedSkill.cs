using LifeRpg.Domain.Common;

namespace LifeRpg.Domain.Entities;

public class UnlockedSkill : Entity
{
    public Guid HeroId { get; set; }
    public Hero? Hero { get; set; }

    public string SkillId { get; set; } = string.Empty;
    public DateTimeOffset UnlockedAt { get; set; }
}
