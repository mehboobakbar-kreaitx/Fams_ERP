using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using FAMS.Application.Modules.Auth.Commands.Login;
using MediatR;
using Microsoft.Extensions.Configuration;

namespace FAMS.Application.Modules.Auth.Commands.ValidateMfaLogin;

public class ValidateMfaLoginCommandHandler : IRequestHandler<ValidateMfaLoginCommand, Result<LoginDto>>
{
    private readonly IIdentityService _identity;
    private readonly IJwtTokenService _jwt;
    private readonly IConfiguration _config;

    public ValidateMfaLoginCommandHandler(IIdentityService identity, IJwtTokenService jwt, IConfiguration config)
    {
        _identity = identity;
        _jwt = jwt;
        _config = config;
    }

    public async Task<Result<LoginDto>> Handle(ValidateMfaLoginCommand request, CancellationToken cancellationToken)
    {
        var userId = _jwt.ValidateMfaChallengeToken(request.MfaChallengeToken);
        if (string.IsNullOrWhiteSpace(userId))
            return Result<LoginDto>.Failure("Invalid MFA challenge.");

        var user = await _identity.FindByIdAsync(userId);
        if (user is null) return Result<LoginDto>.Failure("User not found.");
        if (!user.TwoFactorEnabled) return Result<LoginDto>.Failure("MFA is not enabled.");

        if (!await _identity.VerifyTwoFactorTokenAsync(user.Id, request.Code))
            return Result<LoginDto>.Failure("Invalid MFA code.");

        var accessExpiry = int.Parse(_config["Jwt:AccessTokenExpiryMinutes"] ?? "30");
        var refreshExpiry = int.Parse(_config["Jwt:RefreshTokenExpiryDays"] ?? "7");
        var fullName = $"{user.FirstName} {user.LastName}";

        var accessToken = _jwt.GenerateAccessToken(user.Id, user.Email, fullName, user.CampusId, user.SchoolId, user.Roles);
        var refreshToken = _jwt.GenerateRefreshToken();
        var refreshExpiryAt = DateTime.UtcNow.AddDays(refreshExpiry);

        await _identity.SetRefreshTokenAsync(user.Id, refreshToken, refreshExpiryAt);
        await _identity.UpdateLastLoginAsync(user.Id);

        var dto = new LoginDto(
            accessToken,
            refreshToken,
            DateTime.UtcNow.AddMinutes(accessExpiry),
            user.Id,
            user.Roles,
            user.CampusId,
            user.SchoolId,
            fullName,
            MfaRequired: false,
            MfaEnrollmentRequired: false);

        return Result<LoginDto>.Success(dto);
    }
}
