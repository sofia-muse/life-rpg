using LifeRpg.Domain.Enums;

namespace LifeRpg.Application.Dtos;

public record SuggestedQuestDto(
    string Title,
    string Description,
    QuestType Type,
    QuestDifficulty Difficulty,
    StatName Stat,
    string WhyItFits,
    int? TotalSteps);

public record QuestSuggestionPackDto(string ContractTitle, List<SuggestedQuestDto> Suggestions);

public record BossQuestPlanRequest(string Goal, StatName? SuggestedStat);

public record BossQuestPlanDto(
    string SagaTitle,
    string Title,
    string Description,
    QuestDifficulty Difficulty,
    StatName Stat,
    int TotalSteps,
    List<string> Steps,
    string RewardTitle);

public record ChronicleDto(string Title, string Narrative, List<string> Highlights);
