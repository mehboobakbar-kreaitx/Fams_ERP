using FAMS.Application.Common.Models;
using FAMS.Application.Modules.Auth.Commands.Login;
using MediatR;

namespace FAMS.Application.Modules.Auth.Commands.ValidateMfaLogin;

public record ValidateMfaLoginCommand(string MfaChallengeToken, string Code) : IRequest<Result<LoginDto>>;
