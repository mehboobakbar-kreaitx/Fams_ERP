using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Auth.Commands.VerifyMfa;

public class VerifyMfaCommandHandler : IRequestHandler<VerifyMfaCommand, Result>
{
    private readonly IIdentityService _identity;

    public VerifyMfaCommandHandler(IIdentityService identity) => _identity = identity;

    public async Task<Result> Handle(VerifyMfaCommand request, CancellationToken cancellationToken)
    {
        var enabled = await _identity.EnableTwoFactorAsync(request.UserId, request.Code);
        return enabled ? Result.Success() : Result.Failure("Invalid MFA code.");
    }
}
