using LifeRpg.Application.Common;
using LifeRpg.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;

namespace LifeRpg.IntegrationTests;

/// <summary>
/// Spins up the real API pipeline over an isolated in-memory SQLite database (a single open
/// connection keeps the schema alive for the test's lifetime). No Docker required.
/// </summary>
public class LifeRpgApiFactory : WebApplicationFactory<Program>
{
    private readonly SqliteConnection _connection = new("DataSource=:memory:");

    /// <summary>Configurable fake LLM used by forge tests (set NextDraft per test).</summary>
    public FakeLlmClient Llm { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        // UseSetting writes to host configuration, which is read during Program startup
        // (the JWT signing key is bound there) — earlier than ConfigureAppConfiguration sources.
        builder.UseSetting("UseSqlite", "true");
        builder.UseSetting("Jwt:SigningKey", "integration-test-signing-key-which-is-long-enough-1234567890");
        builder.UseSetting("Jwt:Issuer", "life-rpg");
        builder.UseSetting("Jwt:Audience", "life-rpg-client");

        builder.ConfigureServices(services =>
        {
            // Replace the configured DbContext with one bound to our shared in-memory connection.
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<LifeRpgDbContext>));
            if (descriptor is not null)
            {
                services.Remove(descriptor);
            }

            _connection.Open();
            services.AddDbContext<LifeRpgDbContext>(o => o.UseSqlite(_connection));

            // Replace the real Gemini client with a configurable fake — no network in tests.
            services.RemoveAll(typeof(ILlmClient));
            services.AddSingleton(Llm);
            services.AddSingleton<ILlmClient>(sp => sp.GetRequiredService<FakeLlmClient>());
        });
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        var host = base.CreateHost(builder);
        using var scope = host.Services.CreateScope();
        scope.ServiceProvider.GetRequiredService<LifeRpgDbContext>().Database.EnsureCreated();
        return host;
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing)
        {
            _connection.Dispose();
        }
    }
}
