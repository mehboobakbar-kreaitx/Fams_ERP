using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.SuperAdmin.Schools.Queries.GetSchoolById;

public record GetSchoolByIdQuery(Guid Id) : IRequest<Result<SchoolDetailDto>>;
