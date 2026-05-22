using FAMS.Application.Common.Models;
using FAMS.Application.Common.Security;
using MediatR;

namespace FAMS.Application.Modules.SuperAdmin.Schools.Commands.DeleteSchool;

[Authorize(Roles = "SystemAdmin")]
public record DeleteSchoolCommand(Guid Id) : IRequest<Result>;
