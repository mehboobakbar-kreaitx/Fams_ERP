using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Auth.Commands.SetupMfa;

public record MfaSetupDto(string Secret, string OtpAuthUri);

public record SetupMfaCommand(string UserId) : IRequest<Result<MfaSetupDto>>;
