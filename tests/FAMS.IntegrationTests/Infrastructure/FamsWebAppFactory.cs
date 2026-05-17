using FAMS.Infrastructure.Identity;
using FAMS.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Testcontainers.PostgreSql;
using Testcontainers.Redis;

namespace FAMS.IntegrationTests.Infrastructure;

public class FamsWebAppFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .Build();

    private readonly RedisContainer _redis = new RedisBuilder()
        .WithImage("redis:7-alpine")
        .Build();

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();
        await _redis.StartAsync();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = _postgres.GetConnectionString(),
                ["Redis:Connection"] = _redis.GetConnectionString(),
                ["Jwt:Issuer"] = "https://fams.test",
                ["Jwt:Audience"] = "fams-api",
                ["Jwt:SecretKey"] = "integration-test-secret-key-long-enough-for-hmac256",
                ["Jwt:AccessTokenExpiryMinutes"] = "30",
                ["Jwt:RefreshTokenExpiryDays"] = "7",
                ["Jwt:MfaChallengeExpiryMinutes"] = "5",
                // Disable external services
                ["Seq:Url"] = "http://localhost:5341",
                ["Minio:Endpoint"] = "http://localhost:9000",
            });
        });
    }

    public async Task SeedAsync()
    {
        using var scope = Services.CreateScope();
        var sp = scope.ServiceProvider;
        var db = sp.GetRequiredService<FamsDbContext>();
        var userManager = sp.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = sp.GetRequiredService<RoleManager<IdentityRole>>();
        var logger = sp.GetRequiredService<ILogger<FamsWebAppFactory>>();

        await db.Database.MigrateAsync();
        await DbSeeder.SeedAsync(db, userManager, roleManager, logger);
    }

    async Task IAsyncLifetime.DisposeAsync()
    {
        await _postgres.DisposeAsync();
        await _redis.DisposeAsync();
    }
}
