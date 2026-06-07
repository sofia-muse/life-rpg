using LifeRpg.Domain.Enums;

namespace LifeRpg.Domain.ValueObjects;

/// <summary>Crest/heraldry appearance. Persisted as a JSON column. Mirrors the client's HeroAppearance.</summary>
public sealed class HeroAppearance
{
    public string CrestShape { get; set; } = "shield";
    public string Sigil { get; set; } = "sword";
    public string AccentOverride { get; set; } = "none";
    public string TitleDisplay { get; set; } = string.Empty;
    public List<string> UnlockedShapes { get; set; } = new() { "shield", "circle" };
    public List<string> UnlockedSigils { get; set; } = new() { "sword" };
}

/// <summary>Avatar/character appearance. Persisted as a JSON column. Mirrors the client's CharacterAppearance.</summary>
public sealed class CharacterAppearance
{
    public Gender Gender { get; set; } = Gender.Male;
    public int SkinTone { get; set; }
    public string HairStyle { get; set; } = "short";
    public int HairColor { get; set; }
    public string EyeStyle { get; set; } = "oval";
    public string MouthStyle { get; set; } = "smile";
    public string GlassesStyle { get; set; } = "none";
}

/// <summary>Per-user preferences. Persisted as a JSON column on the hero. Mirrors the client's settings store.</summary>
public sealed class HeroSettings
{
    public bool NotificationsEnabled { get; set; } = true;
    public bool HapticEnabled { get; set; } = true;
    public string ReminderTime { get; set; } = "09:00";

    /// <summary>Opt-in to AI-forged skills (off by default; online-only).</summary>
    public bool AiSkillsEnabled { get; set; }
}
