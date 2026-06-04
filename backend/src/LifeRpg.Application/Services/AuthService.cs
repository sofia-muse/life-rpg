using LifeRpg.Application.Common;
using LifeRpg.Application.Dtos;
using LifeRpg.Application.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace LifeRpg.Application.Services;

public class AuthService
{
    private static readonly TimeSpan RefreshLifetime = TimeSpan.FromDays(30);

    private readonly UserManager<ApplicationUser> _users;
    private readonly ITokenService _tokens;
    private readonly IAppDbContext _db;
    private readonly IClock _clock;

    public AuthService(
        UserManager<ApplicationUser> users,
        ITokenService tokens,
        IAppDbContext db,
        IClock clock)
    {
        _users = users;
        _tokens = tokens;
        _db = db;
        _clock = clock;
    }

    public async Task<Result<AuthResponse>> RegisterAsync(RegisterRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
        {
            return Result<AuthResponse>.Validation("Email and password are required");
        }

        var user = new ApplicationUser
        {
            UserName = req.Email,
            Email = req.Email,
            DisplayName = string.IsNullOrWhiteSpace(req.DisplayName) ? req.Email : req.DisplayName,
            CreatedAt = _clock.UtcNow,
        };

        var created = await _users.CreateAsync(user, req.Password);
        if (!created.Succeeded)
        {
            return Result<AuthResponse>.Validation(string.Join("; ", created.Errors.Select(e => e.Description)));
        }

        return Result<AuthResponse>.Success(await IssueTokensAsync(user));
    }

    public async Task<Result<AuthResponse>> LoginAsync(LoginRequest req)
    {
        var user = await _users.FindByEmailAsync(req.Email);
        if (user is null || !await _users.CheckPasswordAsync(user, req.Password))
        {
            return Result<AuthResponse>.Failure(ErrorType.Unauthorized, "Invalid email or password");
        }

        return Result<AuthResponse>.Success(await IssueTokensAsync(user));
    }

    public async Task<Result<AuthResponse>> RefreshAsync(RefreshRequest req)
    {
        var hash = _tokens.HashRefreshToken(req.RefreshToken);
        var token = await _db.RefreshTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == hash);

        if (token is null || !token.IsActive || token.User is null)
        {
            return Result<AuthResponse>.Failure(ErrorType.Unauthorized, "Invalid or expired refresh token");
        }

        // Rotate: revoke the used token and issue a fresh pair.
        token.RevokedAt = _clock.UtcNow;
        var response = await IssueTokensAsync(token.User);
        return Result<AuthResponse>.Success(response);
    }

    public async Task<Result> LogoutAsync(RefreshRequest req)
    {
        var hash = _tokens.HashRefreshToken(req.RefreshToken);
        var token = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash);
        if (token is not null && token.RevokedAt is null)
        {
            token.RevokedAt = _clock.UtcNow;
            await _db.SaveChangesAsync();
        }
        return Result.Success();
    }

    public async Task<Result<UserDto>> GetMeAsync(Guid userId)
    {
        var user = await _users.FindByIdAsync(userId.ToString());
        return user is null
            ? Result<UserDto>.NotFound("User not found")
            : Result<UserDto>.Success(new UserDto(user.Id, user.Email ?? string.Empty, user.DisplayName));
    }

    private async Task<AuthResponse> IssueTokensAsync(ApplicationUser user)
    {
        var (accessToken, expiresAt) = _tokens.CreateAccessToken(user.Id, user.Email ?? string.Empty);
        var rawRefresh = _tokens.CreateRefreshToken();

        _db.RefreshTokens.Add(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = _tokens.HashRefreshToken(rawRefresh),
            CreatedAt = _clock.UtcNow,
            ExpiresAt = _clock.UtcNow.Add(RefreshLifetime),
        });
        await _db.SaveChangesAsync();

        return new AuthResponse(accessToken, rawRefresh, expiresAt);
    }
}
