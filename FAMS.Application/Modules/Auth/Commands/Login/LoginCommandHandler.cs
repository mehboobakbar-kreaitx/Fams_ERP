using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.Extensions.Configuration;

namespace FAMS.Application.Modules.Auth.Commands.Login;

public class LoginCommandHandler : IRequestHandler<LoginCommand, Result<LoginDto>>
{
    private readonly IIdentityService _identity;
    private readonly IJwtTokenService _jwt;
    private readonly IConfiguration _config;

    public LoginCommandHandler(IIdentityService identity, IJwtTokenService jwt, IConfiguration config)
    {
        _identity = identity;
        _jwt = jwt;
        _config = config;
    }

    public async Task<Result<LoginDto>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = await _identity.FindByEmailAsync(request.Email);
        if (user is null) return Result<LoginDto>.Failure("Invalid credentials.");

        if (!await _identity.CheckPasswordAsync(user.Id, request.Password))
            return Result<LoginDto>.Failure("Invalid credentials.");

        // PRD NFR-09: MFA is mandatory for SystemAdmin and Principal.
        var mfaMandatory = user.Roles.Any(r => r is "SystemAdmin" or "Principal");

        if (mfaMandatory && !user.TwoFactorEnabled)
        {
            var enrollDto = new LoginDto(string.Empty, string.Empty, DateTime.MinValue,
                user.Id, user.Roles, user.CampusId, user.SchoolId, $"{user.FirstName} {user.LastName}",
                MfaRequired: true,
                MfaEnrollmentRequired: true,
                MfaChallengeToken: _jwt.GenerateMfaChallengeToken(user.Id, user.Email));
            return Result<LoginDto>.Success(enrollDto);
        }

        if (user.TwoFactorEnabled)
        {
            if (string.IsNullOrWhiteSpace(request.TotpCode))
            {
                var pendingDto = new LoginDto(string.Empty, string.Empty, DateTime.MinValue,
                    user.Id, user.Roles, user.CampusId, user.SchoolId, $"{user.FirstName} {user.LastName}",
                    MfaRequired: true,
                    MfaEnrollmentRequired: false,
                    MfaChallengeToken: _jwt.GenerateMfaChallengeToken(user.Id, user.Email));
                return Result<LoginDto>.Success(pendingDto);
            }

            if (!await _identity.VerifyTwoFactorTokenAsync(user.Id, request.TotpCode))
                return Result<LoginDto>.Failure("Invalid MFA code.");
        }

        // PRD NFR-09: staff sessions expire in 30 min; students and parents in 60 min.
        var isStudentOrParent = user.Roles.Any(r => r is "Student" or "Parent");
        var accessExpiry = isStudentOrParent
            ? int.Parse(_config["Jwt:StudentAccessTokenExpiryMinutes"] ?? "60")
            : int.Parse(_config["Jwt:AccessTokenExpiryMinutes"] ?? "30");
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
            MfaRequired: false);

        return Result<LoginDto>.Success(dto);
    }
}
