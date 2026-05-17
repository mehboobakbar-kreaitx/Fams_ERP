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

        if (!user.TwoFactorEnabled)
        {
            // Enrollment path: enable 2FA and verify in one atomic step so the
            // caller never needs a separate verify-mfa round-trip. This eliminates
            // the stuck state where verify-mfa succeeds but validate-mfa-login then
            // fails (leaving TwoFactorEnabled=true but no tokens issued).
            var enrolled = await _identity.EnableTwoFactorAsync(user.Id, request.Code);
            if (!enrolled) return Result<LoginDto>.Failure("Invalid MFA code.");
        }
        else
        {
            if (!await _identity.VerifyTwoFactorTokenAsync(user.Id, request.Code))
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
            MfaRequired: false,
            MfaEnrollmentRequired: false);

        return Result<LoginDto>.Success(dto);
    }
}
