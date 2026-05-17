using FAMS.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace FAMS.Infrastructure.Services;

public class JwtTokenService : IJwtTokenService
{
    private const string MfaChallengeTokenUse = "mfa_challenge";
    private const string TokenUseClaim = "token_use";

    private readonly IConfiguration _config;

    public JwtTokenService(IConfiguration config) => _config = config;

    public string GenerateAccessToken(string userId, string email, string fullName, Guid campusId, Guid? schoolId, IEnumerable<string> roles)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(ClaimTypes.NameIdentifier, userId),
            new(ClaimTypes.Email, email),
            new(ClaimTypes.Name, fullName),
            new("campus_id", campusId.ToString())
        };
        if (schoolId.HasValue)
            claims.Add(new Claim("school_id", schoolId.Value.ToString()));
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

        var token = new JwtSecurityToken(
            issuer: JwtIssuer,
            audience: JwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(int.Parse(_config["Jwt:AccessTokenExpiryMinutes"] ?? "30")),
            signingCredentials: CreateSigningCredentials());

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes);
    }

    public string GenerateMfaChallengeToken(string userId, string email)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(ClaimTypes.NameIdentifier, userId),
            new(ClaimTypes.Email, email),
            new(TokenUseClaim, MfaChallengeTokenUse)
        };

        var token = new JwtSecurityToken(
            issuer: JwtIssuer,
            audience: MfaChallengeAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(int.Parse(_config["Jwt:MfaChallengeExpiryMinutes"] ?? "5")),
            signingCredentials: CreateSigningCredentials());

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
    {
        try
        {
            var handler = new JwtSecurityTokenHandler();
            var principal = handler.ValidateToken(token, CreateValidationParameters(JwtAudience, validateLifetime: false), out var securityToken);
            if (securityToken is not JwtSecurityToken jwt
                || !jwt.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.OrdinalIgnoreCase))
                return null;
            return principal;
        }
        catch
        {
            return null;
        }
    }

    public string? ValidateMfaChallengeToken(string token)
    {
        if (string.IsNullOrWhiteSpace(token)) return null;

        try
        {
            var handler = new JwtSecurityTokenHandler();
            var principal = handler.ValidateToken(token, CreateValidationParameters(MfaChallengeAudience, validateLifetime: true), out var securityToken);
            if (securityToken is not JwtSecurityToken jwt
                || !jwt.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.OrdinalIgnoreCase))
                return null;

            var tokenUse = principal.Claims.FirstOrDefault(c => c.Type == TokenUseClaim)?.Value;
            if (!string.Equals(tokenUse, MfaChallengeTokenUse, StringComparison.Ordinal))
                return null;

            return principal.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        }
        catch
        {
            return null;
        }
    }

    private string JwtIssuer => _config["Jwt:Issuer"] ?? "https://fams.local";
    private string JwtAudience => _config["Jwt:Audience"] ?? "fams-api";
    private string MfaChallengeAudience => $"{JwtAudience}:mfa";

    private SigningCredentials CreateSigningCredentials()
    {
        return new SigningCredentials(CreateSigningKey(), SecurityAlgorithms.HmacSha256);
    }

    private SymmetricSecurityKey CreateSigningKey()
    {
        return new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:SecretKey"]!));
    }

    private TokenValidationParameters CreateValidationParameters(string audience, bool validateLifetime)
    {
        return new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = validateLifetime,
            ValidateIssuerSigningKey = true,
            ValidIssuer = JwtIssuer,
            ValidAudience = audience,
            IssuerSigningKey = CreateSigningKey(),
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    }
}
