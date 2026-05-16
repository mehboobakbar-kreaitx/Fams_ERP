using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Academic.Attendance.Queries.GetAttendanceReport;

public record GetAttendanceReportQuery(
    Guid SectionId,
    DateTime StartDate,
    DateTime EndDate,
    Guid? StudentId = null) : IRequest<Result<List<AttendanceStudentRow>>>;
