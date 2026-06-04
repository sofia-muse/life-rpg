using LifeRpg.Domain.Common;
using LifeRpg.Domain.Entities;
using LifeRpg.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace LifeRpg.Infrastructure.Persistence;

public class LifeRpgDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
{
    public LifeRpgDbContext(DbContextOptions<LifeRpgDbContext> options)
        : base(options) { }

    public DbSet<Hero> Heroes => Set<Hero>();
    public DbSet<Quest> Quests => Set<Quest>();
    public DbSet<UnlockedSkill> UnlockedSkills => Set<UnlockedSkill>();
    public DbSet<JournalEntry> JournalEntries => Set<JournalEntry>();
    public DbSet<QuestCompletion> QuestCompletions => Set<QuestCompletion>();
    public DbSet<SyncRequestLog> SyncRequestLogs => Set<SyncRequestLog>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(LifeRpgDbContext).Assembly);

        // SQLite (used in tests) has no SQL Server `rowversion`. Demote RowVersion to a plain,
        // non-concurrency column there so the same model runs on both providers.
        if (Database.IsSqlite())
        {
            foreach (var entityType in builder.Model.GetEntityTypes())
            {
                var rowVersion = entityType.FindProperty("RowVersion");
                if (rowVersion is not null)
                {
                    rowVersion.IsConcurrencyToken = false;
                    rowVersion.ValueGenerated = Microsoft.EntityFrameworkCore.Metadata.ValueGenerated.Never;
                }
            }
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
