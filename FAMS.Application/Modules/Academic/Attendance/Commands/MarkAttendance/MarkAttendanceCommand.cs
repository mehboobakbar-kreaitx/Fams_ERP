using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Academic.Attendance.Commands.MarkAttendance;

public record AttendanceEntry(Guid StudentId, bool IsPresent, bool IsLate, bool IsLeave = false, string? Remarks = null);

public record MarkAttendanceCommand(
    Guid SectionId,
    DateTime Date,
    Guid MarkedById,
    List<AttendanceEntry> Entries,
    bool IsOfflineEntry = false) : IRequest<Result<int>>;
