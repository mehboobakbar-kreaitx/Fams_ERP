using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Academic.Timetable.Commands.CreateTimetable;

public record TimetableSlotInput(
    Guid SectionId,
    Guid SubjectId,
    Guid TeacherId,
    DayOfWeek DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime,
    string? Room);

public record CreateTimetableCommand(
    string TermName,
    IReadOnlyList<TimetableSlotInput> Slots,
    bool ReplaceExisting = false) : IRequest<Result<int>>;
