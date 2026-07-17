using LifeRpg.Application.Common;
using LifeRpg.Application.Identity;
using LifeRpg.Domain.Common;
using LifeRpg.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace LifeRpg.Infrastructure.Persistence;

public class LifeRpgDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>, IAppDbContext
{
    public LifeRpgDbContext(DbContextOptions<LifeRpgDbContext> options)
        : base(options) { }

    public DbSet<Hero> Heroes => Set<Hero>();
    public DbSet<Quest> Quests => Set<Quest>();
    public DbSet<UnlockedSkill> UnlockedSkills => Set<UnlockedSkill>();
    public DbSet<GeneratedSkill> GeneratedSkills => Set<GeneratedSkill>();
    public DbSet<JournalEntry> JournalEntries => Set<JournalEntry>();
    public DbSet<QuestCompletion> QuestCompletions => Set<QuestCompletion>();
    public DbSet<Raid> Raids => Set<Raid>();
    public DbSet<RaidMembership> RaidMemberships => Set<RaidMembership>();
    public DbSet<RaidContribution> RaidContributions => Set<RaidContribution>();
    public DbSet<SyncRequestLog> SyncRequestLogs => Set<SyncRequestLog>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(LifeRpgDbContext).Assembly);

        // RowVersion is a SQL Server `rowversion` concurrency token in production. SQLite (tests)
        // has no equivalent, so promote it only for SQL Server; elsewhere it's a plain byte[] column.
        if (Database.IsSqlServer())
        {
            builder.Entity<Hero>().Property(h => h.RowVersion).IsRowVersion();
            builder.Entity<Quest>().Property(q => q.RowVersion).IsRowVersion();
        }
    }

    public override int SaveChanges()
    {
        StampAudit();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        StampAudit();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void StampAudit()
    {
        var now = DateTimeOffset.UtcNow;
        foreach (var entry in ChangeTracker.Entries<Entity>())
        {
            if (entry.State == EntityState.Added)
            {
                if (entry.Entity.Id == Guid.Empty)
                {
                    entry.Entity.Id = Guid.NewGuid();
                }
                if (entry.Entity.CreatedAt == default)
                {
                    entry.Entity.CreatedAt = now;
                }
                entry.Entity.UpdatedAt = now;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = now;
            }
        }
    }
}
