using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.Platform.Dashboard.Queries.GetTeacherDashboard;

public class GetTeacherDashboardQueryHandler
    : IRequestHandler<GetTeacherDashboardQuery, Result<TeacherDashboardDto>>
{
    private readonly IFamsDbContext _db;

    public GetTeacherDashboardQueryHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<TeacherDashboardDto>> Handle(
        GetTeacherDashboardQuery request, CancellationToken cancellationToken)
    {
        var staff = await _db.StaffMembers.AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == request.StaffId, cancellationToken);
        if (staff is null)
            return Result<TeacherDashboardDto>.Failure("Staff record not found.");

        var sections = await _db.Sections.AsNoTracking()
            .Where(s => s.TeacherId == request.StaffId)
            .Select(s => s.Id)
            .ToListAsync(cancellationToken);

        var studentCount = sections.Count == 0 ? 0 : await _db.Students.AsNoTracking()
            .CountAsync(s => sections.Contains(s.SectionId), cancellationToken);

        var thirtyDaysAgo = DateTime.UtcNow.Date.AddDays(-30);
        var attendance = sections.Count == 0
            ? null
            : await _db.Attendances.AsNoTracking()
                .Where(a => a.Date >= thirtyDaysAgo && a.StudentId != null
                    && _db.Students.Where(s => sections.Contains(s.SectionId)).Select(s => s.Id).Contains(a.StudentId!.Value))
                .GroupBy(a => 1)
                .Select(g => new { Total = g.Count(), Present = g.Count(a => a.IsPresent) })
                .FirstOrDefaultAsync(cancellationToken);

        var attendancePct = attendance is null || attendance.Total == 0
            ? 0m
            : Math.Round((decimal)attendance.Present / attendance.Total * 100m, 2);

        var pendingLeaves = await _db.Leaves.AsNoTracking()
            .CountAsync(l => l.StaffId == request.StaffId && l.Status == "Pending", cancellationToken);

        var today = DateTime.UtcNow.DayOfWeek;
        var todaysClasses = await _db.TimetableSlots.AsNoTracking()
            .Where(t => t.TeacherId == request.StaffId && t.DayOfWeek == today)
            .Join(_db.Subjects, t => t.SubjectId, s => s.Id, (t, s) => new { t, SubjectName = s.Name })
            .Join(_db.Sections, x => x.t.SectionId, sec => sec.Id,
                (x, sec) => new TodayClass(
                    x.t.SubjectId, x.SubjectName, x.t.SectionId, sec.Name,
                    x.t.StartTime, x.t.EndTime, x.t.Room))
            .OrderBy(c => c.StartTime)
            .ToListAsync(cancellationToken);

        var dto = new TeacherDashboardDto(
            request.StaffId,
            staff.FirstName + " " + staff.LastName,
            sections.Count,
            studentCount,
            attendancePct,
            pendingLeaves,
            todaysClasses);

        return Result<TeacherDashboardDto>.Success(dto);
    }
}
