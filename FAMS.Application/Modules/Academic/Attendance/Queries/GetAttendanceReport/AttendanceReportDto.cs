namespace FAMS.Application.Modules.Academic.Attendance.Queries.GetAttendanceReport;

public record AttendanceStudentRow(
    Guid StudentId,
    string StudentName,
    string RollNumber,
    int TotalDays,
    int PresentDays,
    int AbsentDays,
    int LateDays,
    decimal AttendancePercentage,
    bool IneligibleForExam);
