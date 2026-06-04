using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace LifeRpg.Infrastructure.Persistence;

/// <summary>
/// Enables `dotnet ef migrations` at design time without running the API host.
/// Targets SQL Server (the production provider) so migrations match the deployed schema.
/// </summary>
public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<LifeRpgDbContext>
{
    public LifeRpgDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<LifeRpgDbContext>()
            .UseSqlServer("Server=(localdb)\\mssqllocaldb;Database=LifeRpg;Trusted_Connection=True;")
            .Options;
        return new LifeRpgDbContext(options);
    }
}
