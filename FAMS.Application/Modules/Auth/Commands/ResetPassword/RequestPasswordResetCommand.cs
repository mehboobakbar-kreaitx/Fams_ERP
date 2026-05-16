using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Auth.Commands.ResetPassword;

public record RequestPasswordResetCommand(string Email) : IRequest<Result>;

public record ResetPasswordCommand(string Email, string Token, string NewPassword) : IRequest<Result>;
