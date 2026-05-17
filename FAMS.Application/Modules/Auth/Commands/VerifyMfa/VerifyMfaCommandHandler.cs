using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Auth.Commands.VerifyMfa;

public class VerifyMfaCommandHandler : IRequestHandler<VerifyMfaCommand, Result>
{
    private readonly IIdentityService _identity;
    private readonly IJwtTokenService _jwt;

    public VerifyMfaCommandHandler(IIdentityService identity, IJwtTokenService jwt)
    {
        _identity = identity;
        _jwt = jwt;
    }

    public async Task<Result> Handle(VerifyMfaCommand request, CancellationToken cancellationToken)
    {
        var userId = ResolveUserId(request);
        if (string.IsNullOrWhiteSpace(userId))
            return Result.Failure("Invalid MFA challenge.");

        var enabled = await _identity.EnableTwoFactorAsync(userId, request.Code);
        return enabled ? Result.Success() : Result.Failure("Invalid MFA code.");
    }

    private string? ResolveUserId(VerifyMfaCommand request)
    {
        if (!string.IsNullOrWhiteSpace(request.UserId)) return request.UserId;
        return string.IsNullOrWhiteSpace(request.MfaChallengeToken)
            ? null
            : _jwt.ValidateMfaChallengeToken(request.MfaChallengeToken);
    }
}
