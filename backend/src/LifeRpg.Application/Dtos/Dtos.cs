using LifeRpg.Domain.Enums;
using LifeRpg.Domain.ValueObjects;

namespace LifeRpg.Application.Dtos;

// ─── Auth ───
public record RegisterRequest(string Email, string Password, string DisplayName);
public record LoginRequest(string Email, string Password);
public record RefreshRequest(string RefreshToken);
public record AuthResponse(string AccessToken, string RefreshToken, DateTimeOffset ExpiresAt);
public record UserDto(Guid Id, string Email, string DisplayName);

// ─── Hero ───
public record CreateHeroRequest(
    string Name,
    string AvatarSeed,
    List<StatName> FocusStats,
    CharacterAppearance? CharacterAppearance = null);

public record HeroDto(
    Guid Id,
    string Name,
    string AvatarSeed,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    int HeroLevel,
    string ClassName,
    int ClassTier,
    StatName DominantStat,
    int TotalQuestsCompleted,
    int CurrentStreak,
    int LongestStreak,
    DateOnly? LastActiveDate,
    DateOnly? LastStreakFreezeDate,
    DateOnly? LastRewardDate,
    int RestDaysUsed,
    int TotalLoginDays,
    StatBlock StatXp,
    StatBlock Stats,
    HeroAppearance Appearance,
    CharacterAppearance CharacterAppearance,
    List<UnlockedSkillDto> UnlockedSkills,
    HeroSettings Settings);

public record UpdateAppearanceRequest(HeroAppearance? Appearance, CharacterAppearance? CharacterAppearance);

public record WeeklyCupDto(
    string PathLabel,
    string ContractTitle,
    int Score,
    string Rank,
    int CompletedMatches,
    int RequiredCount,
    int BossProgress,
    int StreakBoost,
    string RewardTitle,
    string RewardBadge);

public record StatProgressDto(StatName Stat, int Level, int CurrentXp, int XpNeeded, double Progress);

// ─── Quests ───
public record CreateQuestRequest(
    string Title,
    string Description,
    QuestType Type,
    QuestDifficulty Difficulty,
    StatName Stat,
    int? TotalSteps);

public record QuestDto(
    Guid Id,
    string Title,
    string Description,
    QuestType Type,
    QuestDifficulty Difficulty,
    StatName Stat,
    int XpReward,
    bool IsCompleted,
    bool IsActive,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    DateTimeOffset? CompletedAt,
    int Streak,
    int BestStreak,
    int DaysCompleted,
    int? TotalSteps,
    int? CompletedSteps);

// ─── Quest completion result (mirrors the client's StatLevelUpResult + XPReward) ───
public record SkillDto(string Id, string Name, string Description, string Category, string Icon, string Effect);

public record CompleteQuestResult(
    StatName Stat,
    int XpAwarded,
    int BaseXp,
    int StreakBonus,
    int SkillBonus,
    int OldLevel,
    int NewLevel,
    bool DidLevelUp,
    TierUpDto? TierUp,
    List<SkillDto> NewSkills,
    HeroDto Hero);

public record AdvanceBossQuestResult(QuestDto Quest, CompleteQuestResult? Completion);

public record TierUpDto(int NewTier, string NewClass);

// ─── Skills / Journal / Settings ───
public record UnlockedSkillDto(string SkillId, DateTimeOffset UnlockedAt);

public record JournalEntryDto(
    Guid Id,
    DateOnly Date,
    string Narrative,
    int QuestsCompleted,
    int SkillsUnlocked,
    StatBlock XpGained,
    List<string> LevelsGained,
    List<string> Milestones);

public record SettingsDto(
    bool NotificationsEnabled,
    bool HapticEnabled,
    string ReminderTime,
    bool AiSkillsEnabled,
    string? WeeklyPath,
    string? WeeklyPathWeekKey,
    string? WeeklyPathStartedAt,
    string? WeeklyRewardWeekKey,
    string? WeeklyRewardTitle,
    string? WeeklyRewardBadge);

// ─── Party Raids (cooperative bosses) ───
public record CreateRaidRequest(
    string Title,
    string Description,
    string? SagaTitle,
    string? RewardTitle,
    string UnitLabel,
    int TargetAmount,
    StatName Stat,
    int? MaxMembers,
    DateOnly? Deadline);

public record JoinRaidRequest(string InviteCode);

public record ContributeRaidRequest(
    int Amount,
    string ClientId,
    string? Note);

public record RaidMemberDto(
    Guid HeroId,
    string HeroName,
    string ClassName,
    RaidMemberRole Role,
    int PersonalTotal,
    DateTimeOffset JoinedAt);

public record RaidContributionDto(
    Guid Id,
    Guid HeroId,
    string HeroName,
    int Amount,
    string? Note,
    DateOnly ContributionDate,
    DateTimeOffset CreatedAt);

public record RaidDto(
    Guid Id,
    string Title,
    string Description,
    string SagaTitle,
    string RewardTitle,
    string UnitLabel,
    int TargetAmount,
    int CurrentAmount,
    StatName Stat,
    string InviteCode,
    int MaxMembers,
    int MemberCount,
    DateOnly? Deadline,
    bool IsCompleted,
    DateTimeOffset? CompletedAt,
    DateTimeOffset CreatedAt,
    Guid LeaderHeroId,
    string LeaderHeroName,
    int YourContribution,
    List<RaidMemberDto> Members,
    List<RaidContributionDto> RecentContributions);

public record ContributeRaidResult(RaidDto Raid, bool JustCompleted);
