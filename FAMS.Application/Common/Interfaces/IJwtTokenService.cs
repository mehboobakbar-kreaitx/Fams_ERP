using System.Security.Claims;

namespace FAMS.Application.Common.Interfaces;

public interface IJwtTokenService
{
    string GenerateAccessToken(string userId, string email, string fullName, Guid campusId, Guid? schoolId, IEnumerable<string> roles);
    string GenerateRefreshToken();
    string GenerateMfaChallengeToken(string userId, string email);
    ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
    string? ValidateMfaChallengeToken(string token);
}
