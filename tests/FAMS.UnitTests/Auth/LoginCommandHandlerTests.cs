using FAMS.Application.Common.Interfaces;
using FAMS.Application.Modules.Auth.Commands.Login;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Moq;

namespace FAMS.UnitTests.Auth;

public class LoginCommandHandlerTests
{
    private readonly Mock<IIdentityService> _identity = new();
    private readonly Mock<IJwtTokenService> _jwt = new();
    private readonly IConfiguration _config = BuildConfig();
    private readonly LoginCommandHandler _handler;

    public LoginCommandHandlerTests()
    {
        _handler = new LoginCommandHandler(_identity.Object, _jwt.Object, _config);
    }

    [Fact]
    public async Task Handle_UnknownEmail_ReturnsFailure()
    {
        _identity.Setup(x => x.FindByEmailAsync("unknown@x.com")).ReturnsAsync((AppUserDto?)null);

        var result = await _handler.Handle(new LoginCommand("unknown@x.com", "pw", null), default);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Invalid credentials.");
    }

    [Fact]
    public async Task Handle_WrongPassword_ReturnsFailure()
    {
        var user = MakeUser(roles: ["Teacher"]);
        _identity.Setup(x => x.FindByEmailAsync(user.Email)).ReturnsAsync(user);
        _identity.Setup(x => x.CheckPasswordAsync(user.Id, "wrong")).ReturnsAsync(false);

        var result = await _handler.Handle(new LoginCommand(user.Email, "wrong", null), default);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Invalid credentials.");
    }

    [Fact]
    public async Task Handle_SystemAdminNoMfa_ReturnsMfaEnrollmentRequired()
    {
        var user = MakeUser(roles: ["SystemAdmin"], twoFactor: false);
        _identity.Setup(x => x.FindByEmailAsync(user.Email)).ReturnsAsync(user);
        _identity.Setup(x => x.CheckPasswordAsync(user.Id, "pass")).ReturnsAsync(true);
        _jwt.Setup(x => x.GenerateMfaChallengeToken(user.Id, user.Email)).Returns("challenge-token");

        var result = await _handler.Handle(new LoginCommand(user.Email, "pass", null), default);

        result.IsSuccess.Should().BeTrue();
        result.Value!.MfaRequired.Should().BeTrue();
        result.Value.MfaEnrollmentRequired.Should().BeTrue();
        result.Value.MfaChallengeToken.Should().Be("challenge-token");
        result.Value.AccessToken.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_MfaEnabledNoCodeProvided_ReturnsMfaRequired()
    {
        var user = MakeUser(roles: ["Teacher"], twoFactor: true);
        _identity.Setup(x => x.FindByEmailAsync(user.Email)).ReturnsAsync(user);
        _identity.Setup(x => x.CheckPasswordAsync(user.Id, "pass")).ReturnsAsync(true);
        _jwt.Setup(x => x.GenerateMfaChallengeToken(user.Id, user.Email)).Returns("challenge");

        var result = await _handler.Handle(new LoginCommand(user.Email, "pass", null), default);

        result.IsSuccess.Should().BeTrue();
        result.Value!.MfaRequired.Should().BeTrue();
        result.Value.MfaEnrollmentRequired.Should().BeFalse();
        result.Value.AccessToken.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_MfaEnabledWrongCode_ReturnsFailure()
    {
        var user = MakeUser(roles: ["Teacher"], twoFactor: true);
        _identity.Setup(x => x.FindByEmailAsync(user.Email)).ReturnsAsync(user);
        _identity.Setup(x => x.CheckPasswordAsync(user.Id, "pass")).ReturnsAsync(true);
        _identity.Setup(x => x.VerifyTwoFactorTokenAsync(user.Id, "999999")).ReturnsAsync(false);

        var result = await _handler.Handle(new LoginCommand(user.Email, "pass", "999999"), default);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Be("Invalid MFA code.");
    }

    [Fact]
    public async Task Handle_MfaEnabledCorrectCode_ReturnsTokens()
    {
        var user = MakeUser(roles: ["Principal"], twoFactor: true);
        _identity.Setup(x => x.FindByEmailAsync(user.Email)).ReturnsAsync(user);
        _identity.Setup(x => x.CheckPasswordAsync(user.Id, "pass")).ReturnsAsync(true);
        _identity.Setup(x => x.VerifyTwoFactorTokenAsync(user.Id, "123456")).ReturnsAsync(true);
        _jwt.Setup(x => x.GenerateAccessToken(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<Guid>(), It.IsAny<Guid?>(), It.IsAny<IEnumerable<string>>())).Returns("access");
        _jwt.Setup(x => x.GenerateRefreshToken()).Returns("refresh");
        _identity.Setup(x => x.SetRefreshTokenAsync(user.Id, "refresh", It.IsAny<DateTime>())).Returns(Task.CompletedTask);
        _identity.Setup(x => x.UpdateLastLoginAsync(user.Id)).Returns(Task.CompletedTask);

        var result = await _handler.Handle(new LoginCommand(user.Email, "pass", "123456"), default);

        result.IsSuccess.Should().BeTrue();
        result.Value!.AccessToken.Should().Be("access");
        result.Value.RefreshToken.Should().Be("refresh");
        result.Value.MfaRequired.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_ValidNonMfaUser_ReturnsTokens()
    {
        var user = MakeUser(roles: ["Teacher"], twoFactor: false);
        _identity.Setup(x => x.FindByEmailAsync(user.Email)).ReturnsAsync(user);
        _identity.Setup(x => x.CheckPasswordAsync(user.Id, "pass")).ReturnsAsync(true);
        _jwt.Setup(x => x.GenerateAccessToken(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<Guid>(), It.IsAny<Guid?>(), It.IsAny<IEnumerable<string>>())).Returns("at");
        _jwt.Setup(x => x.GenerateRefreshToken()).Returns("rt");
        _identity.Setup(x => x.SetRefreshTokenAsync(user.Id, "rt", It.IsAny<DateTime>())).Returns(Task.CompletedTask);
        _identity.Setup(x => x.UpdateLastLoginAsync(user.Id)).Returns(Task.CompletedTask);

        var result = await _handler.Handle(new LoginCommand(user.Email, "pass", null), default);

        result.IsSuccess.Should().BeTrue();
        result.Value!.AccessToken.Should().Be("at");
        result.Value.MfaRequired.Should().BeFalse();
    }

    private static AppUserDto MakeUser(IReadOnlyList<string>? roles = null, bool twoFactor = false) =>
        new(
            Id: Guid.NewGuid().ToString(),
            Email: "user@fams.test",
            FirstName: "Test",
            LastName: "User",
            CampusId: Guid.NewGuid(),
            SchoolId: Guid.NewGuid(),
            TwoFactorEnabled: twoFactor,
            Roles: roles ?? ["Teacher"]);

    private static IConfiguration BuildConfig() =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:AccessTokenExpiryMinutes"] = "30",
                ["Jwt:RefreshTokenExpiryDays"] = "7"
            })
            .Build();
}
