namespace LifeRpg.Infrastructure.Ai;

public class LlmOptions
{
    public const string SectionName = "Llm";

    /// <summary>Google AI Studio API key. Supplied via user-secrets locally / Key Vault in prod.</summary>
    public string ApiKey { get; set; } = string.Empty;

    public string Model { get; set; } = "gemini-2.0-flash";
}
