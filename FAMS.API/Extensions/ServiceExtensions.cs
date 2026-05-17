using FAMS.Application.Common.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;

namespace FAMS.API.Extensions;

public static class ServiceExtensions
{
    public static IServiceCollection AddApiServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddControllers();
        services.AddEndpointsApiExplorer();
        services.AddSignalR();

        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo { Title = "FAMS API", Version = "v1", Description = "Falcon Academic Management System API" });
            c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer {token}'",
                Name = "Authorization",
                In = ParameterLocation.Header,
                Type = SecuritySchemeType.ApiKey,
                Scheme = "Bearer"
            });
            c.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } },
                    Array.Empty<string>()
                }
            });
        });

        var jwtKey = configuration["Jwt:SecretKey"] ?? throw new InvalidOperationException("JWT secret key is required.");
        var jwtIssuer = configuration["Jwt:Issuer"] ?? "https://fams.local";
        var jwtAudience = configuration["Jwt:Audience"] ?? "fams-api";

        services.AddAuthentication(options =>
        {
            options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultForbidScheme = JwtBearerDefaults.AuthenticationScheme;
        })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtIssuer,
                    ValidAudience = jwtAudience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
                };

                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        if (!string.IsNullOrEmpty(accessToken) &&
                            context.HttpContext.Request.Path.StartsWithSegments("/hubs"))
                        {
                            context.Token = accessToken;
                        }
                        return Task.CompletedTask;
                    }
                };
            });

        services.AddAuthorization(options =>
        {
            string[] roles = ["SystemAdmin", "Principal", "Teacher", "Student", "Parent",
                "Accountant", "HrOfficer", "ProcurementOfficer", "AcademicCoordinator", "Executive"];
            foreach (var role in roles)
                options.AddPolicy(role, policy => policy.RequireRole(role, "SystemAdmin"));

            options.AddPolicy("ManageUsers", policy => policy.RequireRole("SystemAdmin", "Principal"));
            options.AddPolicy("ViewReports", policy => policy.RequireRole("SystemAdmin", "Principal", "Executive"));
        });

        var allowedOrigins = configuration["Cors:AllowedOrigins"]?.Split(',')
            ?? ["http://localhost:3000", "http://localhost:8080"];

        services.AddCors(options =>
        {
            options.AddPolicy("AllowedOrigins", policy =>
                policy.WithOrigins(allowedOrigins)
                      .AllowAnyHeader()
                      .AllowAnyMethod()
                      .AllowCredentials());
        });

        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(ctx =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: ctx.User.Identity?.IsAuthenticated == true
                        ? ctx.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous"
                        : ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 200,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0,
                    }));

            options.AddPolicy("auth", ctx =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 10,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0,
                    }));
        });

        services.AddHealthChecks()
            .AddCheck("self", () => Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy(), tags: ["live"])
            .AddNpgSql(configuration.GetConnectionString("DefaultConnection") ?? string.Empty, name: "database", tags: ["ready"])
            .AddRedis(configuration["Redis:Connection"] ?? "localhost:6379", name: "redis", tags: ["ready"]);

        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddSingleton<INotificationHub, FAMS.API.Hubs.SignalRNotificationHub>();

        return services;
    }
}

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public string? UserId => User?.FindFirstValue(ClaimTypes.NameIdentifier);
    public string? UserName => User?.FindFirstValue(ClaimTypes.Name);
    public Guid? CampusId
    {
        get
        {
            var campusIdClaim = User?.FindFirstValue("campus_id");
            return Guid.TryParse(campusIdClaim, out var id) ? id : null;
        }
    }
    public Guid? SchoolId
    {
        get
        {
            var claim = User?.FindFirst("school_id")?.Value;
            return Guid.TryParse(claim, out var sid) ? sid : null;
        }
    }
    public IEnumerable<string> Roles => User?.FindAll(ClaimTypes.Role).Select(c => c.Value) ?? [];
    public string? Role => Roles.FirstOrDefault();
    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;
}
