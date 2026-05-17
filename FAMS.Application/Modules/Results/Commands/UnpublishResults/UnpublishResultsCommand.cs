using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Results.Commands.UnpublishResults;

public record UnpublishResultsCommand(
    Guid SubjectId,
    string ExamType,
    string TermName) : IRequest<Result<int>>;
