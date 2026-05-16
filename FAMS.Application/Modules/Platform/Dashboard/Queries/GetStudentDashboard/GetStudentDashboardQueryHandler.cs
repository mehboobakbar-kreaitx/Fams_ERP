using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using FAMS.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.Platform.Dashboard.Queries.GetStudentDashboard;

public class GetStudentDashboardQueryHandler
    : IRequestHandler<GetStudentDashboardQuery, Result<StudentDashboardDto>>
{
    private readonly IFamsDbContext _db;

    public GetStudentDashboardQueryHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<StudentDashboardDto>> Handle(
        GetStudentDashboardQuery request, CancellationToken cancellationToken)
    {
        var student = await _db.Students.AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == request.StudentId, cancellationToken);
        if (student is null)
            return Result<StudentDashboardDto>.Failure("Student record not found.");

        var className = await _db.ClassRooms.AsNoTracking()
            .Where(c => c.Id == student.ClassId)
            .Select(c => c.Name)
            .FirstOrDefaultAsync(cancellationToken) ?? string.Empty;

        var sectionName = await _db.Sections.AsNoTracking()
            .Where(s => s.Id == student.SectionId)
            .Select(s => s.Name)
            .FirstOrDefaultAsync(cancellationToken) ?? string.Empty;

        var thirtyDaysAgo = DateTime.UtcNow.Date.AddDays(-30);
        var attStats = await _db.Attendances.AsNoTracking()
            .Where(a => a.StudentId == request.StudentId && a.Date >= thirtyDaysAgo)
            .GroupBy(a => 1)
            .Select(g => new { Total = g.Count(), Present = g.Count(a => a.IsPresent) })
            .FirstOrDefaultAsync(cancellationToken);

        var attendancePct = attStats is null || attStats.Total == 0
            ? 0m
            : Math.Round((decimal)attStats.Present / attStats.Total * 100m, 2);

        var feeBalance = await _db.FeeInvoices.AsNoTracking()
            .Where(i => i.StudentId == request.StudentId &&
                (i.Status == PaymentStatus.Pending || i.Status == PaymentStatus.PartiallyPaid || i.Status == PaymentStatus.Overdue))
            .SumAsync(i => i.TotalAmount + i.LateFee - i.Discount - i.PaidAmount, cancellationToken);

        var publishedResultsCount = await _db.Results.AsNoTracking()
            .CountAsync(r => r.StudentId == request.StudentId && r.IsPublished, cancellationToken);

        var today = DateTime.UtcNow.DayOfWeek;
        var todaysClasses = await _db.TimetableSlots.AsNoTracking()
            .Where(t => t.SectionId == student.SectionId && t.DayOfWeek == today)
            .Join(_db.Subjects, t => t.SubjectId, s => s.Id, (t, s) => new { t, SubjectName = s.Name })
            .Join(_db.StaffMembers, x => x.t.TeacherId, st => st.Id,
                (x, st) => new UpcomingClass(
                    x.SubjectName, x.t.DayOfWeek, x.t.StartTime, x.t.EndTime,
                    st.FirstName + " " + st.LastName, x.t.Room))
            .OrderBy(c => c.StartTime)
            .ToListAsync(cancellationToken);

        var latestResults = await _db.Results.AsNoTracking()
            .Where(r => r.StudentId == request.StudentId && r.IsPublished)
            .OrderByDescending(r => r.PublishedAt)
            .Take(5)
            .Join(_db.Subjects, r => r.SubjectId, s => s.Id,
                (r, s) => new StudentResultSummary(
                    s.Name, r.TermName,
                    r.TotalMarks == 0 ? 0 : Math.Round(r.MarksObtained / r.TotalMarks * 100m, 2),
                    r.Grade))
            .ToListAsync(cancellationToken);

        var dto = new StudentDashboardDto(
            request.StudentId,
            student.FirstName + " " + student.LastName,
            student.RollNumber,
            className, sectionName,
            attendancePct, feeBalance, publishedResultsCount,
            todaysClasses, latestResults);

        return Result<StudentDashboardDto>.Success(dto);
    }
}
