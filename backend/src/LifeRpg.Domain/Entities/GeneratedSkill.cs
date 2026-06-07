using LifeRpg.Domain.Common;
using LifeRpg.Domain.Enums;

namespace LifeRpg.Domain.Entities;

/// <summary>
/// An AI-"forged" skill personalized to the hero. Unlike the static catalog, these are generated
/// on demand and are immediately active (no stat threshold). The bonus percent and effect string
/// are validated/clamped and constructed server-side, so a model can never inflate power.
/// </summary>
public class GeneratedSkill : Entity
{
    public Guid HeroId { get; set; }
    public Hero? Hero { get; set; }

    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;

    /// <summary>The stat this skill boosts.</summary>
    public StatName Stat { get; set; }

    /// <summary>XP bonus percent for <see cref="Stat"/> quests (clamped 1–10 server-side).</summary>
    public int BonusPercent { get; set; }

    /// <summary>Canonical effect string, e.g. "+7% XP on Strength quests" (built from BonusPercent).</summary>
    public string Effect { get; set; } = string.Empty;
}
