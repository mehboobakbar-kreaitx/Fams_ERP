using FAMS.Application.Common.Interfaces;
using FAMS.Application.Modules.Auth.Commands.Login;
using FAMS.Application.Modules.Auth.Commands.RefreshToken;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Moq;
using System.Security.Claims;

namespace FAMS.UnitTests.Auth;

public class RefreshTokenCommandHandlerTests
{
    private readonly Mock<IIdentityService> _identity = new();
    private readonly Mock<IJwtTokenService> _jwt = new();
    private readonly IConfiguration _config = BuildConfig();
    private readonly RefreshTokenCommandHandler _handler;

    public RefreshTokenCommandHandlerTests()
    {
        _handler = new RefreshTokenCommandHandler(_identity.Object, _jwt.Object, _config);
    }

    [Fact]
    public async Task Handle_InvalidAccessToken_ReturnsFailure()
    {
        _jwt.Setup(x => x.GetPrincipalFromExpiredToken("bad-token")).Returns((ClaimsPrincipal?)null);

        var result = await _handler.Handle(new RefreshTokenCommand("bad-token", "any"), default);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Invalid access token.");
    }

    [Fact]
    public async Task Handle_RefreshTokenMismatch_ReturnsFailure()
    {
        var userId = Guid.NewGuid().ToString();
        SetupValidPrincipal(userId);
        var user = MakeUser(userId);
        _identity.Setup(x => x.FindByIdAsync(userId)).ReturnsAsync(user);
        _identity.Setup(x => x.GetRefreshTokenAsync(userId))
            .ReturnsAsync(("stored-token", DateTime.UtcNow.AddDays(7)));

        var result = await _handler.Handle(new RefreshTokenCommand("access", "different-token"), default);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Refresh token mismatch.");
    }

    [Fact]
    public async Task Handle_ExpiredRefreshToken_ReturnsFailure()
    {
        var userId = Guid.NewGuid().ToString();
        SetupValidPrincipal(userId);
        var user = MakeUser(userId);
        _identity.Setup(x => x.FindByIdAsync(userId)).ReturnsAsync(user);
        _identity.Setup(x => x.GetRefreshTokenAsync(userId))
            .ReturnsAsync(("my-refresh", DateTime.UtcNow.AddDays(-1)));

        var result = await _handler.Handle(new RefreshTokenCommand("access", "my-refresh"), default);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Refresh token expired.");
    }

    [Fact]
    public async Task Handle_ValidRefresh_ReturnsNewTokenPair()
    {
        var userId = Guid.NewGuid().ToString();
        SetupValidPrincipal(userId);
        var user = MakeUser(userId);
        _identity.Setup(x => x.FindByIdAsync(userId)).ReturnsAsync(user);
        _identity.Setup(x => x.GetRefreshTokenAsync(userId))
            .ReturnsAsync(("my-refresh", DateTime.UtcNow.AddDays(7)));
        _jwt.Setup(x => x.GenerateAccessToken(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<Guid>(), It.IsAny<Guid?>(), It.IsAny<IEnumerable<string>>())).Returns("new-access");
        _jwt.Setup(x => x.GenerateRefreshToken()).Returns("new-refresh");
        _identity.Setup(x => x.SetRefreshTokenAsync(userId, "new-refresh", It.IsAny<DateTime>()))
            .Returns(Task.CompletedTask);

        var result = await _handler.Handle(new RefreshTokenCommand("access", "my-refresh"), default);

        result.IsSuccess.Should().BeTrue();
        result.Value!.AccessToken.Should().Be("new-access");
        result.Value.RefreshToken.Should().Be("new-refresh");
        result.Value.MfaRequired.Should().BeFalse();
    }

    private void SetupValidPrincipal(string userId)
    {
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, userId) };
        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims));
        _jwt.Setup(x => x.GetPrincipalFromExpiredToken("access")).Returns(principal);
    }

    private static AppUserDto MakeUser(string userId) =>
        new(userId, "user@fams.test", "Test", "User", Guid.NewGuid(), null, false, ["Teacher"]);

    private static IConfiguration BuildConfig() =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:AccessTokenExpiryMinutes"] = "30",
                ["Jwt:RefreshTokenExpiryDays"] = "7"
            })
            .Build();
}
