using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Auth.Commands.Logout;

public class LogoutCommandHandler : IRequestHandler<LogoutCommand, Result>
{
    private readonly IIdentityService _identity;

    public LogoutCommandHandler(IIdentityService identity) => _identity = identity;

    public async Task<Result> Handle(LogoutCommand request, CancellationToken cancellationToken)
    {
        await _identity.SetRefreshTokenAsync(request.UserId, null, null);
        return Result.Success();
    }
}
