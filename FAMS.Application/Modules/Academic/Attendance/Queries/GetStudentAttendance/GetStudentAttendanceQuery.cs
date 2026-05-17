using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Academic.Attendance.Queries.GetStudentAttendance;

public record GetStudentAttendanceQuery(
    Guid StudentId,
    int PageNumber = 1,
    int PageSize = 30) : IRequest<Result<IReadOnlyList<StudentAttendanceRecordDto>>>;

public record GetStudentAttendanceSummaryQuery(
    Guid StudentId,
    DateTime? StartDate = null,
    DateTime? EndDate = null) : IRequest<Result<StudentAttendanceSummaryDto>>;
