using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Results.Commands.PublishResults;

public record PublishResultsCommand(
    Guid SubjectId,
    string ExamType,
    string TermName) : IRequest<Result<int>>;
