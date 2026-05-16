using FAMS.Domain.Entities;
using FAMS.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FAMS.Infrastructure.Persistence;

public static class DbSeeder
{
    public static async Task SeedAsync(
        FamsDbContext context,
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        ILogger logger)
    {
        await context.Database.MigrateAsync();
        await SeedRolesAsync(roleManager, logger);
        await SeedSuperAdminAsync(userManager, logger);
        await SeedDefaultGradingScaleAsync(context, logger);
    }

    // ── Roles ─────────────────────────────────────────────────────────────────

    private static async Task SeedRolesAsync(RoleManager<IdentityRole> roleManager, ILogger logger)
    {
        string[] roles =
        [
            "SystemAdmin", "Executive", "Principal", "AcademicCoordinator",
            "Teacher", "Accountant", "HrOfficer", "Student", "Parent", "ProcurementOfficer",
        ];

        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
                logger.LogInformation("Seeded role: {Role}", role);
            }
        }
    }

    // ── Super Admin ───────────────────────────────────────────────────────────

    private static async Task SeedSuperAdminAsync(UserManager<ApplicationUser> userManager, ILogger logger)
    {
        const string email    = "superadmin@fams.io";
        const string password = "SuperAdmin@2026!";

        if (await userManager.FindByEmailAsync(email) is not null)
        {
            logger.LogInformation("Super admin already exists — skipping.");
            return;
        }

        var admin = new ApplicationUser
        {
            UserName       = email,
            Email          = email,
            EmailConfirmed = true,
            FirstName      = "System",
            LastName       = "Administrator",
            CampusId       = Guid.Empty,
            SchoolId       = null,
            IsActive       = true,
        };

        var result = await userManager.CreateAsync(admin, password);
        if (result.Succeeded)
        {
            await userManager.AddToRoleAsync(admin, "SystemAdmin");
            logger.LogInformation("Seeded super admin: {Email}", email);
        }
        else
        {
            logger.LogError("Failed to seed super admin: {Errors}",
                string.Join(", ", result.Errors.Select(e => e.Description)));
        }
    }

    // ── Default Grading Scale ─────────────────────────────────────────────────

    private static async Task SeedDefaultGradingScaleAsync(FamsDbContext context, ILogger logger)
    {
        if (await context.GradingScales.AnyAsync(g => g.ProgramId == null))
        {
            logger.LogInformation("Default grading scale already exists — skipping.");
            return;
        }

        var scale = GradingScale.Create("Default");
        context.GradingScales.Add(scale);
        await context.SaveChangesAsync();

        (string Grade, decimal Min, decimal Max, decimal Gpa)[] rules =
        [
            ("A+", 90m, 100m, 4.0m),
            ("A",  80m,  89m, 4.0m),
            ("B",  70m,  79m, 3.0m),
            ("C",  60m,  69m, 2.0m),
            ("D",  50m,  59m, 1.0m),
            ("F",   0m,  49m, 0.0m),
        ];

        foreach (var (grade, min, max, gpa) in rules)
            context.GradingScaleRules.Add(GradingScaleRule.Create(scale.Id, min, max, grade, gpa));

        await context.SaveChangesAsync();
        logger.LogInformation("Seeded default grading scale ({Count} rules).", rules.Length);
    }
}
