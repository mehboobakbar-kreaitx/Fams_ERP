using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Results.Commands.EnterMarks;

public record StudentMarkEntry(
    Guid StudentId,
    decimal MarksObtained,
    string? Remarks = null);

public record EnterMarksCommand(
    Guid SubjectId,
    string ExamType,
    string TermName,
    decimal TotalMarks,
    IReadOnlyList<StudentMarkEntry> Entries) : IRequest<Result<int>>;
