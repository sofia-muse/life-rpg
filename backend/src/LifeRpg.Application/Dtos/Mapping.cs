using LifeRpg.Domain.Entities;
using LifeRpg.Domain.GameConfig;

namespace LifeRpg.Application.Dtos;

/// <summary>Hand-written mappers (entity ↔ DTO). Kept explicit and dependency-free.</summary>
public static class Mapping
{
    public static HeroDto ToDto(this Hero h) => new(
        h.Id, h.Name, h.AvatarSeed, h.CreatedAt, h.UpdatedAt, h.HeroLevel, h.ClassName, h.ClassTier, h.DominantStat,
        h.TotalQuestsCompleted, h.CurrentStreak, h.LongestStreak, h.LastActiveDate, h.LastStreakFreezeDate, h.LastRewardDate,
        h.RestDaysUsed, h.TotalLoginDays, h.StatXp, h.Stats, h.Appearance, h.CharacterAppearance,
        h.UnlockedSkills.OrderBy(s => s.UnlockedAt).Select(s => s.ToDto()).ToList(), h.Settings);

    public static QuestDto ToDto(this Quest q) => new(
        q.Id, q.Title, q.Description, q.Type, q.Difficulty, q.Stat, q.XpReward, q.IsCompleted,
        q.IsActive, q.CreatedAt, q.UpdatedAt, q.CompletedAt, q.Streak, q.BestStreak, q.DaysCompleted, q.TotalSteps, q.CompletedSteps);

    public static UnlockedSkillDto ToDto(this UnlockedSkill s) => new(s.SkillId, s.UnlockedAt);

    public static JournalEntryDto ToDto(this JournalEntry j) => new(
        j.Id, j.Date, j.Narrative, j.QuestsCompleted, j.SkillsUnlocked, j.XpGained, j.LevelsGained, j.Milestones);

    public static SettingsDto ToSettingsDto(this Hero h) => new(
        h.Settings.NotificationsEnabled,
        h.Settings.HapticEnabled,
        h.Settings.ReminderTime,
        h.Settings.AiSkillsEnabled,
        h.Settings.WeeklyPath,
        h.Settings.WeeklyPathWeekKey,
        h.Settings.WeeklyPathStartedAt,
        h.Settings.WeeklyRewardWeekKey,
        h.Settings.WeeklyRewardTitle,
        h.Settings.WeeklyRewardBadge);

    public static SkillDto ToDto(this SkillDefinition s) => new(
        s.Id, s.Name, s.Description, s.Category.ToString().ToLowerInvariant(), s.Icon, s.Effect);

    public static SkillDto ToDto(this GeneratedSkill s) => new(
        $"forged-{s.Id}", s.Name, s.Description, s.Stat.ToString().ToLowerInvariant(), s.Icon, s.Effect);
}
