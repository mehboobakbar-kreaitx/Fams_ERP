using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Results.Queries.GetStudentResults;

public record GetStudentResultsQuery(
    Guid StudentId,
    string? TermName = null,
    string? ExamType = null,
    bool PublishedOnly = true) : IRequest<Result<IReadOnlyList<StudentResultDto>>>;
