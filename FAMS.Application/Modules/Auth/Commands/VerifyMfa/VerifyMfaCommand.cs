using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Auth.Commands.VerifyMfa;

public record VerifyMfaCommand(string Code, string? UserId = null, string? MfaChallengeToken = null) : IRequest<Result>;
