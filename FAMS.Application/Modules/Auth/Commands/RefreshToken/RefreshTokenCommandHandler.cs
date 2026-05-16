using System.Security.Claims;
using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using FAMS.Application.Modules.Auth.Commands.Login;
using MediatR;
using Microsoft.Extensions.Configuration;

namespace FAMS.Application.Modules.Auth.Commands.RefreshToken;

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, Result<LoginDto>>
{
    private readonly IIdentityService _identity;
    private readonly IJwtTokenService _jwt;
    private readonly IConfiguration _config;

    public RefreshTokenCommandHandler(IIdentityService identity, IJwtTokenService jwt, IConfiguration config)
    {
        _identity = identity;
        _jwt = jwt;
        _config = config;
    }

    public async Task<Result<LoginDto>> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var principal = _jwt.GetPrincipalFromExpiredToken(request.AccessToken);
        if (principal is null) return Result<LoginDto>.Failure("Invalid access token.");

        var userId = principal.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return Result<LoginDto>.Failure("Invalid token claims.");

        var user = await _identity.FindByIdAsync(userId);
        if (user is null) return Result<LoginDto>.Failure("User not found.");

        var (storedRefreshToken, expiry) = await _identity.GetRefreshTokenAsync(userId);
        if (storedRefreshToken is null || storedRefreshToken != request.RefreshToken)
            return Result<LoginDto>.Failure("Refresh token mismatch.");
        if (expiry is null || expiry.Value <= DateTime.UtcNow)
            return Result<LoginDto>.Failure("Refresh token expired.");

        var accessExpiry = int.Parse(_config["Jwt:AccessTokenExpiryMinutes"] ?? "30");
        var refreshExpiryDays = int.Parse(_config["Jwt:RefreshTokenExpiryDays"] ?? "7");
        var fullName = $"{user.FirstName} {user.LastName}";

        var newAccessToken = _jwt.GenerateAccessToken(user.Id, user.Email, fullName, user.CampusId, user.Roles);
        var newRefreshToken = _jwt.GenerateRefreshToken();
        var newRefreshExpiry = DateTime.UtcNow.AddDays(refreshExpiryDays);

        await _identity.SetRefreshTokenAsync(user.Id, newRefreshToken, newRefreshExpiry);

        var dto = new LoginDto(newAccessToken, newRefreshToken,
            DateTime.UtcNow.AddMinutes(accessExpiry),
            user.Id, user.Roles, user.CampusId, fullName, MfaRequired: false);

        return Result<LoginDto>.Success(dto);
    }
}
