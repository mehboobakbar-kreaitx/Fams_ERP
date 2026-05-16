using System.Web;
using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Auth.Commands.SetupMfa;

public class SetupMfaCommandHandler : IRequestHandler<SetupMfaCommand, Result<MfaSetupDto>>
{
    private readonly IIdentityService _identity;

    public SetupMfaCommandHandler(IIdentityService identity) => _identity = identity;

    public async Task<Result<MfaSetupDto>> Handle(SetupMfaCommand request, CancellationToken cancellationToken)
    {
        var user = await _identity.FindByIdAsync(request.UserId);
        if (user is null) return Result<MfaSetupDto>.Failure("User not found.");

        var key = await _identity.GetOrCreateAuthenticatorKeyAsync(request.UserId);
        var emailEnc = HttpUtility.UrlEncode(user.Email);
        var uri = $"otpauth://totp/FAMS:{emailEnc}?secret={key}&issuer=FAMS";
        return Result<MfaSetupDto>.Success(new MfaSetupDto(key, uri));
    }
}
