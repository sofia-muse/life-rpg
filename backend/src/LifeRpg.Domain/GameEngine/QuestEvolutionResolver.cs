using LifeRpg.Domain.Entities;
using LifeRpg.Domain.Enums;
using LifeRpg.Domain.GameConfig;

namespace LifeRpg.Domain.GameEngine;

public static class QuestEvolutionResolver
{
    private sealed record EvolutionStage(int UnlockAt, string Title, string Description, QuestDifficulty Difficulty);

    private sealed record EvolutionPath(string Id, EvolutionStage[] Stages);

    private static readonly EvolutionPath[] Paths =
    [
        new("pushups",
        [
            new(0, "20 Push-ups", "Complete 20 push-ups to build upper body strength.", QuestDifficulty.Easy),
            new(3, "30 Push-ups", "Push the volume up and keep your form under control.", QuestDifficulty.Medium),
            new(7, "50 Push-ups", "Turn consistency into endurance with a high-volume set.", QuestDifficulty.Hard),
            new(14, "100 Push-ups in a Day", "Break the century mark with a day-long endurance challenge.", QuestDifficulty.Legendary),
        ]),
        new("hydration",
        [
            new(0, "Drink 8 Glasses of Water", "Stay hydrated throughout the day.", QuestDifficulty.Easy),
            new(3, "Hydration Discipline", "Hit your water goal before the evening slump arrives.", QuestDifficulty.Easy),
            new(7, "Hydration Guardian", "Keep water intake steady and skip the sugary fallback drinks.", QuestDifficulty.Medium),
            new(14, "Perfect Hydration Week", "Maintain disciplined hydration every day this week.", QuestDifficulty.Hard),
        ]),
        new("reading",
        [
            new(0, "Read for 30 Minutes", "Read a book or educational article.", QuestDifficulty.Medium),
            new(3, "Read for 45 Minutes", "Stay with one text long enough to hit true focus.", QuestDifficulty.Medium),
            new(7, "Deep Study Session", "Read, annotate, and capture one key lesson in a single sitting.", QuestDifficulty.Hard),
            new(14, "Finish 3 Focused Reading Sessions", "Complete three deliberate study blocks across the day.", QuestDifficulty.Legendary),
        ]),
        new("social",
        [
            new(0, "Reach Out to a Friend", "Send a meaningful message to someone you care about.", QuestDifficulty.Easy),
            new(3, "Meaningful Check-In", "Have a real, present conversation that goes past small talk.", QuestDifficulty.Medium),
            new(7, "Strengthen Your Circle", "Reconnect intentionally and offer support where it matters.", QuestDifficulty.Hard),
            new(14, "Host a Catch-Up", "Create the moment instead of waiting for it to happen.", QuestDifficulty.Legendary),
        ]),
        new("productivity",
        [
            new(0, "Complete Top 3 Tasks", "Finish your three most important tasks today.", QuestDifficulty.Medium),
            new(3, "Complete Top 5 Tasks", "Expand your execution window without losing focus.", QuestDifficulty.Medium),
            new(7, "Deep Focus Block", "Clear a protected block to drive one important outcome forward.", QuestDifficulty.Hard),
            new(14, "Ship the Critical Path", "Finish the tasks that move your project or day decisively forward.", QuestDifficulty.Legendary),
        ]),
        new("meditation",
        [
            new(0, "Meditate for 10 Minutes", "Practice mindfulness meditation.", QuestDifficulty.Medium),
            new(3, "Meditate for 15 Minutes", "Hold your focus a little longer when the mind wants to wander.", QuestDifficulty.Medium),
            new(7, "Do the Hard Thing First", "Face resistance early and let momentum carry the rest of the day.", QuestDifficulty.Hard),
            new(14, "Discipline Rite", "Complete a composed morning ritual before the world starts pulling at you.", QuestDifficulty.Legendary),
        ]),
    ];

    public static void Apply(Quest quest, IEnumerable<string> unlockedSkillIds)
    {
        if (quest.Type != QuestType.Daily)
        {
            return;
        }

        var path = Paths.FirstOrDefault(candidate =>
            (!string.IsNullOrWhiteSpace(quest.EvolutionPathId) && candidate.Id == quest.EvolutionPathId)
            || candidate.Stages.Any(stage => stage.Title == quest.Title));
        if (path is null)
        {
            return;
        }

        var unlocked = unlockedSkillIds as IReadOnlyCollection<string> ?? unlockedSkillIds.ToArray();
        var index = 0;
        for (var i = 0; i < path.Stages.Length; i++)
        {
            var stage = path.Stages[i];
            if (quest.DaysCompleted < stage.UnlockAt)
            {
                break;
            }

            if (!SkillResolver.IsDifficultyAllowed(stage.Difficulty, quest.Stat, unlocked))
            {
                break;
            }

            index = i;
        }

        var chosen = path.Stages[index];
        quest.EvolutionPathId = path.Id;
        quest.Difficulty = chosen.Difficulty;
        quest.XpReward = DifficultyXp.For(chosen.Difficulty);
    }
}
