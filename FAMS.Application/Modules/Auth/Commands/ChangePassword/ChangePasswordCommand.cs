using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Auth.Commands.ChangePassword;

public record ChangePasswordCommand(string UserId, string OldPassword, string NewPassword) : IRequest<Result>;
