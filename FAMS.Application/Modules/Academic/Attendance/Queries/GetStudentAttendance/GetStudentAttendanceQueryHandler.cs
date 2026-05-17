using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.Academic.Attendance.Queries.GetStudentAttendance;

public class GetStudentAttendanceQueryHandler
    : IRequestHandler<GetStudentAttendanceQuery, Result<IReadOnlyList<StudentAttendanceRecordDto>>>
{
    private readonly IFamsDbContext _db;
    public GetStudentAttendanceQueryHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<IReadOnlyList<StudentAttendanceRecordDto>>> Handle(
        GetStudentAttendanceQuery request, CancellationToken cancellationToken)
    {
        var rows = await _db.Attendances
            .AsNoTracking()
            .Where(a => a.StudentId == request.StudentId)
            .OrderByDescending(a => a.Date)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(a => new StudentAttendanceRecordDto(
                a.Id,
                a.Date,
                a.IsLate ? "Late"
                    : a.IsPresent ? "Present"
                    : a.Remarks == "On approved leave" ? "Leave"
                    : "Absent",
                a.Remarks))
            .ToListAsync(cancellationToken);

        return Result<IReadOnlyList<StudentAttendanceRecordDto>>.Success(rows);
    }
}

public class GetStudentAttendanceSummaryQueryHandler
    : IRequestHandler<GetStudentAttendanceSummaryQuery, Result<StudentAttendanceSummaryDto>>
{
    private readonly IFamsDbContext _db;
    public GetStudentAttendanceSummaryQueryHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<StudentAttendanceSummaryDto>> Handle(
        GetStudentAttendanceSummaryQuery request, CancellationToken cancellationToken)
    {
        var query = _db.Attendances.AsNoTracking()
            .Where(a => a.StudentId == request.StudentId);
        if (request.StartDate.HasValue)
            query = query.Where(a => a.Date >= request.StartDate.Value.Date);
        if (request.EndDate.HasValue)
            query = query.Where(a => a.Date <= request.EndDate.Value.Date);

        var records = await query
            .Select(a => new { a.IsPresent, a.IsLate })
            .ToListAsync(cancellationToken);

        var total = records.Count;
        var present = records.Count(r => r.IsPresent);
        var late = records.Count(r => r.IsLate);
        var absent = total - present;
        var pct = total == 0 ? 0m : Math.Round((decimal)present / total * 100m, 2);

        return Result<StudentAttendanceSummaryDto>.Success(
            new StudentAttendanceSummaryDto(total, present, absent, late, pct));
    }
}
