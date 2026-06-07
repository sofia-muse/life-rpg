using LifeRpg.Domain.Entities;
using LifeRpg.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LifeRpg.Infrastructure.Persistence.Configurations;

public class HeroConfiguration : IEntityTypeConfiguration<Hero>
{
    public void Configure(EntityTypeBuilder<Hero> b)
    {
        b.ToTable("Heroes");
        b.HasKey(h => h.Id);
        b.HasIndex(h => h.UserId).IsUnique();

        b.Property(h => h.Name).HasMaxLength(40).IsRequired();
        b.Property(h => h.AvatarSeed).HasMaxLength(64);
        b.Property(h => h.ClassName).HasMaxLength(64);
        b.Property(h => h.DominantStat).HasConversion<string>().HasMaxLength(20);

        // Complex value objects as JSON string columns.
        b.Property(h => h.StatXp).HasConversion(JsonValue.Converter<StatBlock>())
            .Metadata.SetValueComparer(JsonValue.Comparer<StatBlock>());
        b.Property(h => h.Stats).HasConversion(JsonValue.Converter<StatBlock>())
            .Metadata.SetValueComparer(JsonValue.Comparer<StatBlock>());
        b.Property(h => h.Appearance).HasConversion(JsonValue.Converter<HeroAppearance>())
            .Metadata.SetValueComparer(JsonValue.Comparer<HeroAppearance>());
        b.Property(h => h.CharacterAppearance).HasConversion(JsonValue.Converter<CharacterAppearance>())
            .Metadata.SetValueComparer(JsonValue.Comparer<CharacterAppearance>());
        b.Property(h => h.Settings).HasConversion(JsonValue.Converter<HeroSettings>())
            .Metadata.SetValueComparer(JsonValue.Comparer<HeroSettings>());

        // RowVersion is promoted to a SQL Server rowversion concurrency token in OnModelCreating;
        // on SQLite (tests) it stays a plain byte[] column.

        b.HasMany(h => h.Quests).WithOne(q => q.Hero!).HasForeignKey(q => q.HeroId).OnDelete(DeleteBehavior.Cascade);
        b.HasMany(h => h.UnlockedSkills).WithOne(s => s.Hero!).HasForeignKey(s => s.HeroId).OnDelete(DeleteBehavior.Cascade);
        b.HasMany(h => h.GeneratedSkills).WithOne(s => s.Hero!).HasForeignKey(s => s.HeroId).OnDelete(DeleteBehavior.Cascade);
        b.HasMany(h => h.JournalEntries).WithOne(j => j.Hero!).HasForeignKey(j => j.HeroId).OnDelete(DeleteBehavior.Cascade);
        b.HasMany(h => h.QuestCompletions).WithOne(c => c.Hero!).HasForeignKey(c => c.HeroId).OnDelete(DeleteBehavior.Cascade);
    }
}
