using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Auth.Commands.ChangePassword;

public class ChangePasswordCommandHandler : IRequestHandler<ChangePasswordCommand, Result>
{
    private readonly IIdentityService _identity;

    public ChangePasswordCommandHandler(IIdentityService identity) => _identity = identity;

    public async Task<Result> Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
    {
        var (succeeded, error) = await _identity.ChangePasswordAsync(request.UserId, request.OldPassword, request.NewPassword);
        return succeeded ? Result.Success() : Result.Failure(error ?? "Password change failed.");
    }
}
