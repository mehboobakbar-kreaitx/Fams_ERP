using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Academic.Attendance.Queries.GetSectionAttendance;

public record SectionAttendanceEntryDto(Guid StudentId, bool IsPresent, bool IsLate, bool IsLeave, string? Remarks);

public record GetSectionAttendanceQuery(Guid SectionId, DateTime Date)
    : IRequest<Result<IReadOnlyList<SectionAttendanceEntryDto>>>;
