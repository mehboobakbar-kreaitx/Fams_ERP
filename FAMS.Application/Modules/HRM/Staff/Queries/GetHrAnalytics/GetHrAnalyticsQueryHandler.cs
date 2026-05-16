using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.HRM.Staff.Queries.GetHrAnalytics;

public class GetHrAnalyticsQueryHandler : IRequestHandler<GetHrAnalyticsQuery, Result<HrAnalyticsDto>>
{
    private readonly IFamsDbContext _db;

    public GetHrAnalyticsQueryHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<HrAnalyticsDto>> Handle(GetHrAnalyticsQuery request, CancellationToken cancellationToken)
    {
        var staff = await _db.StaffMembers.AsNoTracking()
            .Where(s => s.CampusId == request.CampusId)
            .Select(s => new { s.Department, s.EmploymentType, s.IsActive, s.BasicSalary })
            .ToListAsync(cancellationToken);

        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var nextMonth = monthStart.AddMonths(1);

        var pendingLeaves = await _db.Leaves.AsNoTracking()
            .CountAsync(l => l.CampusId == request.CampusId && l.Status == "Pending", cancellationToken);

        var approvedLeavesThisMonth = await _db.Leaves.AsNoTracking()
            .CountAsync(l => l.CampusId == request.CampusId
                          && l.Status == "Approved"
                          && l.StartDate >= monthStart
                          && l.StartDate < nextMonth, cancellationToken);

        var departmentGroups = staff
            .GroupBy(s => s.Department)
            .Select(g => new DepartmentHeadcountItem(
                g.Key,
                g.Count(s => s.IsActive),
                g.Count(s => !s.IsActive)))
            .OrderByDescending(d => d.ActiveCount)
            .ToList();

        var employmentTypes = staff
            .Where(s => s.IsActive)
            .GroupBy(s => s.EmploymentType)
            .Select(g => new EmploymentTypeItem(g.Key, g.Count()))
            .OrderByDescending(e => e.Count)
            .ToList();

        var dto = new HrAnalyticsDto(
            staff.Count,
            staff.Count(s => s.IsActive),
            staff.Count(s => !s.IsActive),
            pendingLeaves,
            approvedLeavesThisMonth,
            staff.Where(s => s.IsActive).Sum(s => s.BasicSalary),
            departmentGroups,
            employmentTypes);

        return Result<HrAnalyticsDto>.Success(dto);
    }
}
