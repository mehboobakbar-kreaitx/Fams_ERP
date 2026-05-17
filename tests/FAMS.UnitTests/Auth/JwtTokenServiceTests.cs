using FAMS.Infrastructure.Services;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace FAMS.UnitTests.Auth;

public class JwtTokenServiceTests
{
    private readonly JwtTokenService _sut;
    private readonly string _userId = Guid.NewGuid().ToString();
    private readonly string _email = "test@fams.test";
    private readonly Guid _campusId = Guid.NewGuid();

    public JwtTokenServiceTests()
    {
        _sut = new JwtTokenService(BuildConfig());
    }

    [Fact]
    public void GenerateAccessToken_ReturnsValidJwt()
    {
        var token = _sut.GenerateAccessToken(_userId, _email, "Test User", _campusId, null, ["Teacher"]);

        token.Should().NotBeNullOrEmpty();
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);

        // Token is created with new JwtSecurityToken() directly — claim types are stored as full URIs
        jwt.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value.Should().Be(_userId);
        jwt.Claims.FirstOrDefault(c => c.Type == "campus_id")?.Value.Should().Be(_campusId.ToString());
        jwt.Audiences.Should().Contain("fams-api");
        jwt.Issuer.Should().Be("https://fams.local");
    }

    [Fact]
    public void GenerateAccessToken_WithSchoolId_IncludesSchoolIdClaim()
    {
        var schoolId = Guid.NewGuid();
        var token = _sut.GenerateAccessToken(_userId, _email, "Test User", _campusId, schoolId, ["Teacher"]);

        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);
        jwt.Claims.FirstOrDefault(c => c.Type == "school_id")?.Value.Should().Be(schoolId.ToString());
    }

    [Fact]
    public void GenerateRefreshToken_ReturnsUniqueBase64String()
    {
        var t1 = _sut.GenerateRefreshToken();
        var t2 = _sut.GenerateRefreshToken();

        t1.Should().NotBeNullOrEmpty();
        t2.Should().NotBeNullOrEmpty();
        t1.Should().NotBe(t2);
        // verify it is valid base64
        var bytes = Convert.FromBase64String(t1);
        bytes.Length.Should().Be(64);
    }

    [Fact]
    public void GenerateMfaChallengeToken_ContainsMfaClaim()
    {
        var token = _sut.GenerateMfaChallengeToken(_userId, _email);

        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);
        jwt.Claims.FirstOrDefault(c => c.Type == "token_use")?.Value.Should().Be("mfa_challenge");
        jwt.Audiences.Should().Contain("fams-api:mfa");
    }

    [Fact]
    public void ValidateMfaChallengeToken_ValidToken_ReturnsUserId()
    {
        var token = _sut.GenerateMfaChallengeToken(_userId, _email);

        var result = _sut.ValidateMfaChallengeToken(token);

        result.Should().Be(_userId);
    }

    [Fact]
    public void ValidateMfaChallengeToken_AccessToken_ReturnsNull()
    {
        // access tokens have a different audience — should NOT validate as MFA token
        var accessToken = _sut.GenerateAccessToken(_userId, _email, "Test User", _campusId, null, ["Teacher"]);

        var result = _sut.ValidateMfaChallengeToken(accessToken);

        result.Should().BeNull();
    }

    [Fact]
    public void GetPrincipalFromExpiredToken_ExpiredToken_ReturnsPrincipal()
    {
        // Generate with 0-minute expiry by using a specially-configured service
        var shortConfig = BuildConfig(accessExpiryMinutes: "0");
        var shortSut = new JwtTokenService(shortConfig);
        var token = shortSut.GenerateAccessToken(_userId, _email, "Test User", _campusId, null, ["Teacher"]);

        // Even though expired (or barely valid), GetPrincipalFromExpiredToken ignores lifetime
        var principal = _sut.GetPrincipalFromExpiredToken(token);

        principal.Should().NotBeNull();
        principal!.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value.Should().Be(_userId);
    }

    [Fact]
    public void GetPrincipalFromExpiredToken_GarbageToken_ReturnsNull()
    {
        var result = _sut.GetPrincipalFromExpiredToken("not.a.jwt");

        result.Should().BeNull();
    }

    private static IConfiguration BuildConfig(string accessExpiryMinutes = "30") =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Issuer"] = "https://fams.local",
                ["Jwt:Audience"] = "fams-api",
                ["Jwt:SecretKey"] = "super-secret-test-key-that-is-long-enough-for-hmac256",
                ["Jwt:AccessTokenExpiryMinutes"] = accessExpiryMinutes,
                ["Jwt:RefreshTokenExpiryDays"] = "7",
                ["Jwt:MfaChallengeExpiryMinutes"] = "5"
            })
            .Build();
}
