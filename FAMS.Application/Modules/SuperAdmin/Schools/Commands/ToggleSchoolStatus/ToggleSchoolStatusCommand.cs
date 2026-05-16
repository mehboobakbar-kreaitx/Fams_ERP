using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.SuperAdmin.Schools.Commands.ToggleSchoolStatus;

public record ToggleSchoolStatusCommand(Guid Id, bool IsActive) : IRequest<Result>;
