using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.CRM.Queries.GetStudentById;

public record GetStudentByIdQuery(Guid Id) : IRequest<Result<StudentDetailDto>>;
