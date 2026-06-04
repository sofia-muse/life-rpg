using LifeRpg.Domain.Enums;

namespace LifeRpg.Domain.ValueObjects;

/// <summary>
/// A value carrying one integer per stat. Used for both total XP per stat
/// (mirrors the client's <c>Record&lt;StatName, number&gt;</c>) and computed stat levels.
/// </summary>
public sealed class StatBlock
{
    public int Strength { get; set; }
    public int Vitality { get; set; }
    public int Intelligence { get; set; }
    public int Charisma { get; set; }
    public int Dexterity { get; set; }
    public int Willpower { get; set; }

    public StatBlock() { }

    public StatBlock(int value)
    {
        Strength = Vitality = Intelligence = Charisma = Dexterity = Willpower = value;
    }

    public int this[StatName stat]
    {
        get => stat switch
        {
            StatName.Strength => Strength,
            StatName.Vitality => Vitality,
            StatName.Intelligence => Intelligence,
            StatName.Charisma => Charisma,
            StatName.Dexterity => Dexterity,
            StatName.Willpower => Willpower,
            _ => throw new ArgumentOutOfRangeException(nameof(stat)),
        };
        set
        {
            switch (stat)
            {
                case StatName.Strength: Strength = value; break;
                case StatName.Vitality: Vitality = value; break;
                case StatName.Intelligence: Intelligence = value; break;
                case StatName.Charisma: Charisma = value; break;
                case StatName.Dexterity: Dexterity = value; break;
                case StatName.Willpower: Willpower = value; break;
                default: throw new ArgumentOutOfRangeException(nameof(stat));
            }
        }
    }

    public IEnumerable<int> Values()
    {
        yield return Strength;
        yield return Vitality;
        yield return Intelligence;
        yield return Charisma;
        yield return Dexterity;
        yield return Willpower;
    }

    public StatBlock Clone() => new()
    {
        Strength = Strength,
        Vitality = Vitality,
        Intelligence = Intelligence,
        Charisma = Charisma,
        Dexterity = Dexterity,
        Willpower = Willpower,
    };
}
