namespace LifeRpg.Infrastructure.Identity;

public class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "life-rpg";
    public string Audience { get; set; } = "life-rpg-client";

    /// <summary>HMAC signing key. In production this is supplied from Key Vault, never the repo.</summary>
    public string SigningKey { get; set; } = string.Empty;

    public int AccessTokenMinutes { get; set; } = 15;
}
