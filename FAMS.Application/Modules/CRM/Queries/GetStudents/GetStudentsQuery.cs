using FAMS.Application.Common.Models;
using FAMS.Domain.Enums;
using MediatR;

namespace FAMS.Application.Modules.CRM.Queries.GetStudents;

public record GetStudentsQuery(
    Guid CampusId,
    int PageNumber = 1,
    int PageSize = 20,
    string? SearchTerm = null,
    Guid? ClassId = null,
    StudentStatus? Status = null) : IRequest<Result<PaginatedList<StudentDto>>>;
