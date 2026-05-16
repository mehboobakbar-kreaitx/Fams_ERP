using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FAMS.Application.Modules.Auth.Commands.ResetPassword;

public class RequestPasswordResetCommandHandler : IRequestHandler<RequestPasswordResetCommand, Result>
{
    private readonly IIdentityService _identity;
    private readonly IEmailService _email;
    private readonly ILogger<RequestPasswordResetCommandHandler> _logger;

    public RequestPasswordResetCommandHandler(IIdentityService identity, IEmailService email,
        ILogger<RequestPasswordResetCommandHandler> logger)
    {
        _identity = identity;
        _email = email;
        _logger = logger;
    }

    public async Task<Result> Handle(RequestPasswordResetCommand request, CancellationToken cancellationToken)
    {
        var token = await _identity.GeneratePasswordResetTokenAsync(request.Email);
        if (!string.IsNullOrEmpty(token))
        {
            try
            {
                var body = $"<p>You requested a password reset for FAMS.</p>" +
                           $"<p>Reset token: <code>{token}</code></p>" +
                           $"<p>This token expires in a few hours. If you did not request this, please ignore.</p>";
                await _email.SendAsync(request.Email, "FAMS — Password reset", body, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Password reset email failed for {Email}", request.Email);
            }
        }
        return Result.Success();
    }
}

public class ResetPasswordCommandHandler : IRequestHandler<ResetPasswordCommand, Result>
{
    private readonly IIdentityService _identity;

    public ResetPasswordCommandHandler(IIdentityService identity) => _identity = identity;

    public async Task<Result> Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        var (succeeded, error) = await _identity.ResetPasswordAsync(request.Email, request.Token, request.NewPassword);
        return succeeded ? Result.Success() : Result.Failure(error ?? "Password reset failed.");
    }
}
