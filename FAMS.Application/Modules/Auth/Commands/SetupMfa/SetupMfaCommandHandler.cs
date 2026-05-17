using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Auth.Commands.SetupMfa;

public class SetupMfaCommandHandler : IRequestHandler<SetupMfaCommand, Result<MfaSetupDto>>
{
    private readonly IIdentityService _identity;
    private readonly IJwtTokenService _jwt;
    private readonly IMfaQrCodeService _qrCode;

    public SetupMfaCommandHandler(IIdentityService identity, IJwtTokenService jwt, IMfaQrCodeService qrCode)
    {
        _identity = identity;
        _jwt = jwt;
        _qrCode = qrCode;
    }

    public async Task<Result<MfaSetupDto>> Handle(SetupMfaCommand request, CancellationToken cancellationToken)
    {
        var userId = ResolveUserId(request);
        if (string.IsNullOrWhiteSpace(userId))
            return Result<MfaSetupDto>.Failure("Invalid MFA challenge.");

        var user = await _identity.FindByIdAsync(userId);
        if (user is null) return Result<MfaSetupDto>.Failure("User not found.");
        if (user.TwoFactorEnabled) return Result<MfaSetupDto>.Failure("MFA is already enabled.");

        var key = await _identity.GetOrCreateAuthenticatorKeyAsync(userId);
        var otpAuthUri = GenerateOtpAuthUri(user.Email, key);
        var qrCodeDataUrl = _qrCode.GenerateDataUrl(otpAuthUri);

        return Result<MfaSetupDto>.Success(new MfaSetupDto(qrCodeDataUrl, key, key, otpAuthUri));
    }

    private string? ResolveUserId(SetupMfaCommand request)
    {
        if (!string.IsNullOrWhiteSpace(request.UserId)) return request.UserId;
        return string.IsNullOrWhiteSpace(request.MfaChallengeToken)
            ? null
            : _jwt.ValidateMfaChallengeToken(request.MfaChallengeToken);
    }

    private static string GenerateOtpAuthUri(string email, string key)
    {
        var issuer = Uri.EscapeDataString("FAMS");
        var account = Uri.EscapeDataString(email);
        // secret must be raw Base32 per the otpauth spec — never URI-encode it
        var secret = key.TrimEnd('=');
        return $"otpauth://totp/{issuer}:{account}?secret={secret}&issuer={issuer}&algorithm=SHA1&digits=6&period=30";
    }
}
