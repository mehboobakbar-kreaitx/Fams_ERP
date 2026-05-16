using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using FAMS.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.Platform.Dashboard.Queries.GetPrincipalDashboard;

public class GetPrincipalDashboardQueryHandler
    : IRequestHandler<GetPrincipalDashboardQuery, Result<PrincipalDashboardDto>>
{
    private readonly IFamsDbContext _db;

    public GetPrincipalDashboardQueryHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<PrincipalDashboardDto>> Handle(
        GetPrincipalDashboardQuery request, CancellationToken cancellationToken)
    {
        var campusId = request.CampusId;
        var today = DateTime.UtcNow.Date;

        var totalStudents = await _db.Students.AsNoTracking()
            .CountAsync(s => s.CampusId == campusId
                          && (s.Status == StudentStatus.Enrolled || s.Status == StudentStatus.Active),
                cancellationToken);

        var totalStaff = await _db.StaffMembers.AsNoTracking()
            .CountAsync(s => s.CampusId == campusId && s.IsActive, cancellationToken);

        var activeClasses = await _db.ClassRooms.AsNoTracking()
            .CountAsync(c => c.CampusId == campusId && c.IsActive, cancellationToken);

        var todaysAttendanceRows = _db.Attendances.AsNoTracking()
            .Where(a => a.CampusId == campusId && a.Date == today && a.StudentId != null);
        var attendanceTotal = await todaysAttendanceRows.CountAsync(cancellationToken);
        var attendancePresent = await todaysAttendanceRows.CountAsync(a => a.IsPresent, cancellationToken);

        var attendancePct = attendanceTotal == 0
            ? 0m
            : Math.Round((decimal)attendancePresent / attendanceTotal * 100m, 2);

        var outstanding = await _db.FeeInvoices.AsNoTracking()
            .Where(i => i.CampusId == campusId &&
                (i.Status == PaymentStatus.Pending || i.Status == PaymentStatus.PartiallyPaid || i.Status == PaymentStatus.Overdue))
            .SumAsync(i => i.TotalAmount + i.LateFee - i.Discount - i.PaidAmount, cancellationToken);

        var pendingLeaves = await _db.Leaves.AsNoTracking()
            .CountAsync(l => l.CampusId == campusId && l.Status == "Pending", cancellationToken);

        var openApplications = await _db.Applications.AsNoTracking()
            .CountAsync(a => a.CampusId == campusId &&
                a.Status != ApplicationStatus.Enrolled &&
                a.Status != ApplicationStatus.Declined &&
                a.Status != ApplicationStatus.Withdrawn, cancellationToken);

        var publishedExams = await _db.Exams.AsNoTracking()
            .CountAsync(e => e.CampusId == campusId && e.IsPublished, cancellationToken);

        var recentAdmissions = await _db.Students.AsNoTracking()
            .Where(s => s.CampusId == campusId && s.Status == StudentStatus.Enrolled)
            .OrderByDescending(s => s.EnrollmentDate)
            .Take(5)
            .Select(s => new RecentAdmission(s.Id, s.FirstName + " " + s.LastName, s.RollNumber, s.EnrollmentDate))
            .ToListAsync(cancellationToken);

        var dto = new PrincipalDashboardDto(
            totalStudents, totalStaff, activeClasses, attendancePct, outstanding,
            pendingLeaves, openApplications, publishedExams, recentAdmissions);

        return Result<PrincipalDashboardDto>.Success(dto);
    }
}
