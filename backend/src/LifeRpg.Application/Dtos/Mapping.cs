using LifeRpg.Domain.Entities;
using LifeRpg.Domain.GameConfig;

namespace LifeRpg.Application.Dtos;

/// <summary>Hand-written mappers (entity ↔ DTO). Kept explicit and dependency-free.</summary>
public static class Mapping
{
    public static HeroDto ToDto(this Hero h) => new(
        h.Id, h.Name, h.AvatarSeed, h.HeroLevel, h.ClassName, h.ClassTier, h.DominantStat,
        h.TotalQuestsCompleted, h.CurrentStreak, h.LongestStreak, h.LastActiveDate, h.LastRewardDate,
        h.TotalLoginDays, h.StatXp, h.Stats, h.Appearance, h.CharacterAppearance, h.Settings);

    public static QuestDto ToDto(this Quest q) => new(
        q.Id, q.Title, q.Description, q.Type, q.Difficulty, q.Stat, q.XpReward, q.IsCompleted,
        q.IsActive, q.CompletedAt, q.Streak, q.BestStreak, q.DaysCompleted, q.TotalSteps, q.CompletedSteps);

    public static UnlockedSkillDto ToDto(this UnlockedSkill s) => new(s.SkillId, s.UnlockedAt);

    public static JournalEntryDto ToDto(this JournalEntry j) => new(
        j.Id, j.Date, j.Narrative, j.QuestsCompleted, j.SkillsUnlocked, j.XpGained, j.LevelsGained, j.Milestones);

    public static SettingsDto ToSettingsDto(this Hero h) => new(
        h.Settings.NotificationsEnabled, h.Settings.HapticEnabled, h.Settings.ReminderTime);

    public static SkillDto ToDto(this SkillDefinition s) => new(
        s.Id, s.Name, s.Description, s.Category.ToString().ToLowerInvariant(), s.Icon, s.Effect);
}
