using FAMS.Infrastructure.Identity;
using FAMS.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Testcontainers.PostgreSql;
using Testcontainers.Redis;

namespace FAMS.IntegrationTests.Infrastructure;

public class FamsWebAppFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    // Fixed test JWT config — same values used in token generation AND Bearer validation.
    public const string TestJwtKey    = "integration-test-secret-key-long-enough-for-hmac256";
    public const string TestJwtIssuer = "https://fams.test";
    public const string TestJwtAudience = "fams-api";

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
                ["Redis:Connection"]                    = _redis.GetConnectionString(),
                ["Jwt:Issuer"]                         = TestJwtIssuer,
                ["Jwt:Audience"]                       = TestJwtAudience,
                ["Jwt:SecretKey"]                      = TestJwtKey,
                ["Jwt:AccessTokenExpiryMinutes"]       = "30",
                ["Jwt:RefreshTokenExpiryDays"]         = "7",
                ["Jwt:MfaChallengeExpiryMinutes"]      = "5",
                ["Seq:Url"]                            = "http://localhost:5341",
                ["Minio:Endpoint"]                     = "http://localhost:9000",
                ["JazzCash:MerchantId"]                = "test-merchant",
                ["JazzCash:Password"]                  = "test-password",
                ["JazzCash:IntegritySalt"]             = "test-salt",
            });
        });

        // PostConfigure guarantees the test signing key + issuer override the
        // values captured at service-registration time in AddApiServices —
        // required because WebApplicationBuilder processes appsettings.json
        // before ConfigureAppConfiguration sources in the minimal-API hosting model.
        builder.ConfigureServices(services =>
        {
            services.PostConfigure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, options =>
            {
                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TestJwtKey));
                options.TokenValidationParameters.IssuerSigningKey = key;
                options.TokenValidationParameters.ValidIssuer      = TestJwtIssuer;
                options.TokenValidationParameters.ValidAudience    = TestJwtAudience;
            });
        });
    }

    public async Task SeedAsync()
    {
        using var scope = Services.CreateScope();
        var sp          = scope.ServiceProvider;
        var db          = sp.GetRequiredService<FamsDbContext>();
        var userManager = sp.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = sp.GetRequiredService<RoleManager<IdentityRole>>();
        var logger      = sp.GetRequiredService<ILogger<FamsWebAppFactory>>();

        await db.Database.MigrateAsync();
        await DbSeeder.SeedAsync(db, userManager, roleManager, logger);
        await SeedTestUsersAsync(userManager);
    }

    private static async Task SeedTestUsersAsync(UserManager<ApplicationUser> userManager)
    {
        await EnsureUser(userManager,
            email: "teacher@campus1.fams.io",
            password: "Teacher@2026!",
            firstName: "Test", lastName: "Teacher",
            role: "Teacher");

        await EnsureUser(userManager,
            email: "student@campus1.fams.io",
            password: "Student@2026!",
            firstName: "Test", lastName: "Student",
            role: "Student");
    }

    private static async Task EnsureUser(UserManager<ApplicationUser> userManager,
        string email, string password, string firstName, string lastName, string role)
    {
        if (await userManager.FindByEmailAsync(email) is not null) return;

        var user = new ApplicationUser
        {
            UserName       = email,
            Email          = email,
            EmailConfirmed = true,
            FirstName      = firstName,
            LastName       = lastName,
            CampusId       = Guid.NewGuid(),
            IsActive       = true,
        };

        var result = await userManager.CreateAsync(user, password);
        if (result.Succeeded)
            await userManager.AddToRoleAsync(user, role);
    }

    async Task IAsyncLifetime.DisposeAsync()
    {
        await _postgres.DisposeAsync();
        await _redis.DisposeAsync();
    }
}
