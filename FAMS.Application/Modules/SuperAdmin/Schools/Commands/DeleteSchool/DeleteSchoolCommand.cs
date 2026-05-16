using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.SuperAdmin.Schools.Commands.DeleteSchool;

public record DeleteSchoolCommand(Guid Id) : IRequest<Result>;
