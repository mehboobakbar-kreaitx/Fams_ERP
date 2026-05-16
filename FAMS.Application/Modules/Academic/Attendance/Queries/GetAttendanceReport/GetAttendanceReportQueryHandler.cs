using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.Academic.Attendance.Queries.GetAttendanceReport;

public class GetAttendanceReportQueryHandler : IRequestHandler<GetAttendanceReportQuery, Result<List<AttendanceStudentRow>>>
{
    private const decimal AttendanceThreshold = 75m;
    private readonly IFamsDbContext _db;

    public GetAttendanceReportQueryHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<List<AttendanceStudentRow>>> Handle(GetAttendanceReportQuery request, CancellationToken cancellationToken)
    {
        var studentQuery = _db.Students.AsNoTracking()
            .Where(s => s.SectionId == request.SectionId);
        if (request.StudentId.HasValue)
            studentQuery = studentQuery.Where(s => s.Id == request.StudentId.Value);

        var students = await studentQuery
            .Select(s => new { s.Id, s.FirstName, s.LastName, s.RollNumber })
            .ToListAsync(cancellationToken);
        if (students.Count == 0)
            return Result<List<AttendanceStudentRow>>.Success(new List<AttendanceStudentRow>());

        var startDate = request.StartDate.Date;
        var endDate = request.EndDate.Date;
        var studentIds = students.Select(s => s.Id).ToList();

        var attendance = await _db.Attendances
            .Where(a => a.StudentId != null && studentIds.Contains(a.StudentId.Value)
                && a.Date >= startDate && a.Date <= endDate)
            .Select(a => new { a.StudentId, a.IsPresent, a.IsLate })
            .ToListAsync(cancellationToken);

        var rows = students.Select(s =>
        {
            var records = attendance.Where(a => a.StudentId == s.Id).ToList();
            var total = records.Count;
            var present = records.Count(r => r.IsPresent);
            var absent = total - present;
            var late = records.Count(r => r.IsLate);
            var pct = total == 0 ? 0m : Math.Round((decimal)present / total * 100m, 2);
            return new AttendanceStudentRow(
                s.Id, $"{s.FirstName} {s.LastName}", s.RollNumber,
                total, present, absent, late, pct, pct < AttendanceThreshold);
        }).ToList();

        return Result<List<AttendanceStudentRow>>.Success(rows);
    }
}
