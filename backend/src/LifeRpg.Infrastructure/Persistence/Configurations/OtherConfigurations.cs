using LifeRpg.Domain.Entities;
using LifeRpg.Domain.ValueObjects;
using LifeRpg.Application.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LifeRpg.Infrastructure.Persistence.Configurations;

public class QuestConfiguration : IEntityTypeConfiguration<Quest>
{
    public void Configure(EntityTypeBuilder<Quest> b)
    {
        b.ToTable("Quests");
        b.HasKey(q => q.Id);
        b.Property(q => q.Title).HasMaxLength(120).IsRequired();
        b.Property(q => q.Description).HasMaxLength(500);
        b.Property(q => q.Type).HasConversion<string>().HasMaxLength(10);
        b.Property(q => q.Difficulty).HasConversion<string>().HasMaxLength(12);
        b.Property(q => q.Stat).HasConversion<string>().HasMaxLength(20);
        // RowVersion promoted to rowversion for SQL Server in OnModelCreating (SQLite-safe otherwise).
        b.HasIndex(q => new { q.HeroId, q.Type, q.IsActive });
    }
}

public class UnlockedSkillConfiguration : IEntityTypeConfiguration<UnlockedSkill>
{
    public void Configure(EntityTypeBuilder<UnlockedSkill> b)
    {
        b.ToTable("UnlockedSkills");
        b.HasKey(s => s.Id);
        b.Property(s => s.SkillId).HasMaxLength(20).IsRequired();
        b.HasIndex(s => new { s.HeroId, s.SkillId }).IsUnique();
    }
}

public class GeneratedSkillConfiguration : IEntityTypeConfiguration<GeneratedSkill>
{
    public void Configure(EntityTypeBuilder<GeneratedSkill> b)
    {
        b.ToTable("GeneratedSkills");
        b.HasKey(s => s.Id);
        b.Property(s => s.Name).HasMaxLength(40).IsRequired();
        b.Property(s => s.Description).HasMaxLength(160);
        b.Property(s => s.Icon).HasMaxLength(8);
        b.Property(s => s.Effect).HasMaxLength(80);
        b.Property(s => s.Stat).HasConversion<string>().HasMaxLength(20);
        b.HasIndex(s => s.HeroId);
    }
}

public class JournalEntryConfiguration : IEntityTypeConfiguration<JournalEntry>
{
    public void Configure(EntityTypeBuilder<JournalEntry> b)
    {
        b.ToTable("JournalEntries");
        b.HasKey(j => j.Id);
        b.Property(j => j.Narrative).HasMaxLength(2000);
        b.HasIndex(j => new { j.HeroId, j.Date }).IsUnique();

        b.Property(j => j.XpGained).HasConversion(JsonValue.Converter<StatBlock>())
            .Metadata.SetValueComparer(JsonValue.Comparer<StatBlock>());
        b.Property(j => j.LevelsGained).HasConversion(JsonValue.ListConverter())
            .Metadata.SetValueComparer(JsonValue.ListComparer());
        b.Property(j => j.Milestones).HasConversion(JsonValue.ListConverter())
            .Metadata.SetValueComparer(JsonValue.ListComparer());
    }
}

public class QuestCompletionConfiguration : IEntityTypeConfiguration<QuestCompletion>
{
    public void Configure(EntityTypeBuilder<QuestCompletion> b)
    {
        b.ToTable("QuestCompletions");
        b.HasKey(c => c.Id);
        b.Property(c => c.Stat).HasConversion<string>().HasMaxLength(20);
        b.HasIndex(c => new { c.HeroId, c.CompletionDate });
    }
}

public class SyncRequestLogConfiguration : IEntityTypeConfiguration<SyncRequestLog>
{
    public void Configure(EntityTypeBuilder<SyncRequestLog> b)
    {
        b.ToTable("SyncRequestLogs");
        b.HasKey(s => s.Id);
        b.Property(s => s.OpId).HasMaxLength(128).IsRequired();
        b.HasIndex(s => new { s.UserId, s.OpId }).IsUnique();
    }
}

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> b)
    {
        b.ToTable("RefreshTokens");
        b.HasKey(t => t.Id);
        b.Property(t => t.TokenHash).HasMaxLength(128).IsRequired();
        b.HasIndex(t => t.TokenHash);
        b.HasOne(t => t.User).WithMany(u => u.RefreshTokens).HasForeignKey(t => t.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}
