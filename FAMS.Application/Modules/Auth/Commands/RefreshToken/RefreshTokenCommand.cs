using FAMS.Application.Common.Models;
using FAMS.Application.Modules.Auth.Commands.Login;
using MediatR;

namespace FAMS.Application.Modules.Auth.Commands.RefreshToken;

public record RefreshTokenCommand(string AccessToken, string RefreshToken) : IRequest<Result<LoginDto>>;
