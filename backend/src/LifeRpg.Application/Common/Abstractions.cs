using LifeRpg.Domain.Entities;
using LifeRpg.Application.Identity;
using Microsoft.EntityFrameworkCore;

namespace LifeRpg.Application.Common;

/// <summary>Persistence surface the Application layer depends on (implemented by the DbContext).</summary>
public interface IAppDbContext
{
    DbSet<Hero> Heroes { get; }
    DbSet<Quest> Quests { get; }
    DbSet<UnlockedSkill> UnlockedSkills { get; }
    DbSet<JournalEntry> JournalEntries { get; }
    DbSet<QuestCompletion> QuestCompletions { get; }
    DbSet<SyncRequestLog> SyncRequestLogs { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

/// <summary>The authenticated caller (implemented in the API from the JWT).</summary>
public interface ICurrentUser
{
    Guid? UserId { get; }
    bool IsAuthenticated { get; }
}

public interface IClock
{
    DateTimeOffset UtcNow { get; }
    DateOnly Today { get; }
}

public sealed class SystemClock : IClock
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
    public DateOnly Today => DateOnly.FromDateTime(DateTime.UtcNow);
}

/// <summary>Issues JWT access tokens and opaque refresh tokens (implemented in Infrastructure).</summary>
public interface ITokenService
{
    (string AccessToken, DateTimeOffset ExpiresAt) CreateAccessToken(Guid userId, string email);
    string CreateRefreshToken();
    string HashRefreshToken(string rawToken);
}
