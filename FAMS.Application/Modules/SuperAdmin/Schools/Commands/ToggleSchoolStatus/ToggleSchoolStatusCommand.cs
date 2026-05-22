using FAMS.Application.Common.Models;
using FAMS.Application.Common.Security;
using MediatR;

namespace FAMS.Application.Modules.SuperAdmin.Schools.Commands.ToggleSchoolStatus;

[Authorize(Roles = "SystemAdmin")]
public record ToggleSchoolStatusCommand(Guid Id, bool IsActive) : IRequest<Result>;
