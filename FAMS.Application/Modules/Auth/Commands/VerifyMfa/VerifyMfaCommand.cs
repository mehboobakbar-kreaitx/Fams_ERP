using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Auth.Commands.VerifyMfa;

public record VerifyMfaCommand(string UserId, string Code) : IRequest<Result>;
