using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace FAMS.IntegrationTests.Infrastructure;

public static class TestAuthHelper
{
    // Build a signed JWT directly — no DI needed, no config race condition.
    public static string GenerateToken(
        string userId,
        string email,
        string fullName,
        Guid campusId,
        Guid? schoolId,
        params string[] roles)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(ClaimTypes.NameIdentifier, userId),
            new(ClaimTypes.Email, email),
            new(ClaimTypes.Name, fullName),
            new("campus_id", campusId.ToString()),
        };
        if (schoolId.HasValue)
            claims.Add(new Claim("school_id", schoolId.Value.ToString()));
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(FamsWebAppFactory.TestJwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: FamsWebAppFactory.TestJwtIssuer,
            audience: FamsWebAppFactory.TestJwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(30),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public static string SystemAdminToken(FamsWebAppFactory _)
        => GenerateToken(
            userId: "system-admin-test-id",
            email: "superadmin@fams.io",
            fullName: "System Admin",
            campusId: Guid.Empty,
            schoolId: null,
            roles: "SystemAdmin");

    public static string TeacherToken(FamsWebAppFactory _, Guid campusId)
        => GenerateToken(
            userId: Guid.NewGuid().ToString(),
            email: "teacher@fams.test",
            fullName: "Test Teacher",
            campusId: campusId,
            schoolId: null,
            roles: "Teacher");

    public static string StudentToken(FamsWebAppFactory _, string userId, Guid campusId)
        => GenerateToken(
            userId: userId,
            email: "student@fams.test",
            fullName: "Test Student",
            campusId: campusId,
            schoolId: null,
            roles: "Student");
}
