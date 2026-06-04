using LifeRpg.Application.Common;
using LifeRpg.Application.Identity;
using LifeRpg.Application.Services;
using LifeRpg.Infrastructure.Identity;
using LifeRpg.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace LifeRpg.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Default");
        var useSqlite = configuration.GetValue<bool>("UseSqlite")
            || string.IsNullOrWhiteSpace(connectionString);

        services.AddDbContext<LifeRpgDbContext>(options =>
        {
            if (useSqlite)
            {
                options.UseSqlite(connectionString ?? "Data Source=lifrpg.db");
            }
            else
            {
                options.UseSqlServer(connectionString);
            }
        });

        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<LifeRpgDbContext>());

        services
            .AddIdentityCore<ApplicationUser>(options =>
            {
                options.Password.RequiredLength = 8;
                options.User.RequireUniqueEmail = true;
            })
            .AddRoles<IdentityRole<Guid>>()
            .AddEntityFrameworkStores<LifeRpgDbContext>();

        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
        services.AddScoped<ITokenService, TokenService>();
        services.AddSingleton<IClock, SystemClock>();

        // Application services.
        services.AddScoped<AuthService>();
        services.AddScoped<HeroService>();
        services.AddScoped<QuestService>();
        services.AddScoped<SyncService>();

        return services;
    }
}
