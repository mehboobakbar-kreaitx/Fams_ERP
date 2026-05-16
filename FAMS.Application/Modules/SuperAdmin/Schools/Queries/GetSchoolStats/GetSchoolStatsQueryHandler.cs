using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using FAMS.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.SuperAdmin.Schools.Queries.GetSchoolStats;

public class GetSchoolStatsQueryHandler
    : IRequestHandler<GetSchoolStatsQuery, Result<SchoolStatsDto>>
{
    private readonly IFamsDbContext _db;

    public GetSchoolStatsQueryHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<SchoolStatsDto>> Handle(
        GetSchoolStatsQuery request, CancellationToken cancellationToken)
    {
        var schoolId = request.SchoolId;

        // All campus IDs belonging to this school (bypass global campus filter via IgnoreQueryFilters)
        var campusIds = await _db.Campuses.IgnoreQueryFilters()
            .Where(c => c.SchoolId == schoolId && !c.IsDeleted)
            .Select(c => c.Id)
            .ToListAsync(cancellationToken);

        var campusCount = campusIds.Count;

        if (campusCount == 0)
            return Result<SchoolStatsDto>.Success(new SchoolStatsDto(0, 0, 0, 0m, 0m));

        var studentCount = await _db.Students.AsNoTracking()
            .CountAsync(s => campusIds.Contains(s.CampusId)
                          && (s.Status == StudentStatus.Enrolled || s.Status == StudentStatus.Active),
                cancellationToken);

        var staffCount = await _db.StaffMembers.AsNoTracking()
            .CountAsync(s => campusIds.Contains(s.CampusId) && s.IsActive,
                cancellationToken);

        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var monthEnd   = monthStart.AddMonths(1);

        var monthlyRevenue = await _db.FeePayments.AsNoTracking()
            .Where(p => campusIds.Contains(p.CampusId)
                     && p.CreatedAt >= monthStart && p.CreatedAt < monthEnd)
            .SumAsync(p => (decimal?)p.Amount, cancellationToken) ?? 0m;

        var today = now.Date;
        var attendanceTotal   = await _db.Attendances.AsNoTracking()
            .CountAsync(a => campusIds.Contains(a.CampusId) && a.Date == today && a.StudentId != null,
                cancellationToken);
        var attendancePresent = await _db.Attendances.AsNoTracking()
            .CountAsync(a => campusIds.Contains(a.CampusId) && a.Date == today && a.StudentId != null && a.IsPresent,
                cancellationToken);

        var attendanceRate = attendanceTotal == 0
            ? 0m
            : Math.Round((decimal)attendancePresent / attendanceTotal * 100m, 1);

        return Result<SchoolStatsDto>.Success(new SchoolStatsDto(
            campusCount, studentCount, staffCount, monthlyRevenue, attendanceRate));
    }
}
