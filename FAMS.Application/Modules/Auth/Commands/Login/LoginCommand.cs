using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Auth.Commands.Login;

public record LoginCommand(string Email, string Password, string? TotpCode = null) : IRequest<Result<LoginDto>>;
