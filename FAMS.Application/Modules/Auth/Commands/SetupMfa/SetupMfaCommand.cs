using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Auth.Commands.SetupMfa;

public record MfaSetupDto(
    string QrCodeDataUrl,
    string ManualKey,
    string Secret,
    string OtpAuthUri);

public record SetupMfaCommand(string? UserId = null, string? MfaChallengeToken = null) : IRequest<Result<MfaSetupDto>>;
