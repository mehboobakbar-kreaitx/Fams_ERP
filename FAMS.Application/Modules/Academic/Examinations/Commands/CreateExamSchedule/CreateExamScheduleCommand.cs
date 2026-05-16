using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Academic.Examinations.Commands.CreateExamSchedule;

public record ExamScheduleItemInput(
    Guid SubjectId,
    DateTime ExamDate,
    TimeOnly StartTime,
    TimeOnly EndTime,
    decimal TotalMarks,
    string? Hall);

public record CreateExamScheduleCommand(
    string Name,
    string ExamType,
    string TermName,
    Guid ClassId,
    DateTime StartDate,
    DateTime EndDate,
    IReadOnlyList<ExamScheduleItemInput> Items) : IRequest<Result<Guid>>;
