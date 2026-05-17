using FAMS.Application.Common.Interfaces;
using Microsoft.Extensions.DependencyInjection;

namespace FAMS.IntegrationTests.Infrastructure;

public static class TestAuthHelper
{
    // Generates a real signed JWT directly via IJwtTokenService — bypasses the login endpoint
    // so MFA enrollment state on the seeded SystemAdmin user does not block tests.
    public static string GenerateToken(
        FamsWebAppFactory factory,
        string userId,
        string email,
        string fullName,
        Guid campusId,
        Guid? schoolId,
        params string[] roles)
    {
        using var scope = factory.Services.CreateScope();
        var jwt = scope.ServiceProvider.GetRequiredService<IJwtTokenService>();
        return jwt.GenerateAccessToken(userId, email, fullName, campusId, schoolId, roles);
    }

    public static string SystemAdminToken(FamsWebAppFactory factory)
        => GenerateToken(factory,
            userId: "system-admin-test-id",
            email: "superadmin@fams.io",
            fullName: "System Admin",
            campusId: Guid.Empty,
            schoolId: null,
            roles: "SystemAdmin");

    public static string TeacherToken(FamsWebAppFactory factory, Guid campusId)
        => GenerateToken(factory,
            userId: Guid.NewGuid().ToString(),
            email: "teacher@fams.test",
            fullName: "Test Teacher",
            campusId: campusId,
            schoolId: null,
            roles: "Teacher");

    public static string StudentToken(FamsWebAppFactory factory, string userId, Guid campusId)
        => GenerateToken(factory,
            userId: userId,
            email: "student@fams.test",
            fullName: "Test Student",
            campusId: campusId,
            schoolId: null,
            roles: "Student");
}
