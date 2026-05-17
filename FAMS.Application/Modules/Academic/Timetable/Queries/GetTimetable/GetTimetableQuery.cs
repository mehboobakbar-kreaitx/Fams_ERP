using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Academic.Timetable.Queries.GetTimetable;

public record GetTimetableQuery(
    string? TermName,
    Guid? SectionId = null,
    Guid? TeacherId = null,
    Guid? StudentId = null) : IRequest<Result<IReadOnlyList<TimetableSlotDto>>>;
