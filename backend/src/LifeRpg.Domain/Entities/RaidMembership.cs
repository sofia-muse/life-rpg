using LifeRpg.Domain.Common;
using LifeRpg.Domain.Enums;

namespace LifeRpg.Domain.Entities;

public class RaidMembership : Entity
{
    public Guid RaidId { get; set; }
    public Raid? Raid { get; set; }

    public Guid HeroId { get; set; }
    public Hero? Hero { get; set; }

    public RaidMemberRole Role { get; set; } = RaidMemberRole.Member;
    public DateTimeOffset JoinedAt { get; set; }
}
