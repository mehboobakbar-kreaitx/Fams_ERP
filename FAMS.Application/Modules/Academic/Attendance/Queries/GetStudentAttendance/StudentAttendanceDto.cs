namespace FAMS.Application.Modules.Academic.Attendance.Queries.GetStudentAttendance;

public record StudentAttendanceRecordDto(
    Guid Id,
    DateTime Date,
    string Status,
    string? Remarks);

public record StudentAttendanceSummaryDto(
    int TotalDays,
    int PresentDays,
    int AbsentDays,
    int LateDays,
    decimal AttendancePercentage);
