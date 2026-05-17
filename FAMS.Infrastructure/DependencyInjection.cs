using Amazon.Runtime;
using Amazon.S3;
using FAMS.Application.Common.Interfaces;
using FAMS.Infrastructure.Identity;
using FAMS.Infrastructure.Persistence;
using FAMS.Infrastructure.Services;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StackExchange.Redis;

namespace FAMS.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? configuration["ConnectionString"]
            ?? throw new InvalidOperationException("Database connection string is required.");

        services.AddSingleton<RlsConnectionInterceptor>();

        services.AddDbContext<FamsDbContext>((sp, options) =>
            options
                .UseNpgsql(connectionString, b => b.MigrationsAssembly(typeof(FamsDbContext).Assembly.FullName))
                .AddInterceptors(sp.GetRequiredService<RlsConnectionInterceptor>()));

        services.AddScoped<IFamsDbContext>(provider => provider.GetRequiredService<FamsDbContext>());

        services.AddIdentity<ApplicationUser, IdentityRole>(options =>
        {
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireUppercase = true;
            options.Password.RequireNonAlphanumeric = true;
            options.Password.RequiredLength = 8;
            options.User.RequireUniqueEmail = true;
        })
        .AddEntityFrameworkStores<FamsDbContext>()
        .AddDefaultTokenProviders();

        var redisConnection = configuration["Redis:Connection"] ?? "localhost:6379";
        services.AddSingleton<IConnectionMultiplexer>(_ => ConnectionMultiplexer.Connect(redisConnection));

        services.AddSingleton<IAmazonS3>(_ =>
        {
            var endpoint = configuration["Minio:Endpoint"] ?? "http://localhost:9000";
            var accessKey = configuration["Minio:AccessKey"] ?? "minioadmin";
            var secretKey = configuration["Minio:SecretKey"] ?? "minioadmin";
            var config = new AmazonS3Config
            {
                ServiceURL = endpoint,
                ForcePathStyle = true,
                UseHttp = endpoint.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
            };
            return new AmazonS3Client(new BasicAWSCredentials(accessKey, secretKey), config);
        });

        services.AddHangfire(config => config
            .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
            .UseSimpleAssemblyNameTypeSerializer()
            .UseRecommendedSerializerSettings()
            .UsePostgreSqlStorage(c => c.UseNpgsqlConnection(connectionString)));

        services.AddHangfireServer();

        services.AddHttpClient("Anthropic");
        services.AddHttpClient("LMS");

        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<ISmsService, SmsService>();
        services.AddScoped<IStorageService, StorageService>();
        services.AddScoped<IAiChatbotService, AiChatbotService>();
        services.AddSingleton<IDateTime, DateTimeService>();
        services.AddSingleton<IJwtTokenService, JwtTokenService>();
        services.AddSingleton<IMfaQrCodeService, MfaQrCodeService>();
        services.AddScoped<IIdentityService, IdentityService>();
        services.AddScoped<IPdfService, PdfService>();
        services.AddScoped<IJazzCashService, JazzCashService>();
        services.AddScoped<ILmsService, LmsService>();

        return services;
    }
}
