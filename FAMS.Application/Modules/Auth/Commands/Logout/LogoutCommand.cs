using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Auth.Commands.Logout;

public record LogoutCommand(string UserId) : IRequest<Result>;
