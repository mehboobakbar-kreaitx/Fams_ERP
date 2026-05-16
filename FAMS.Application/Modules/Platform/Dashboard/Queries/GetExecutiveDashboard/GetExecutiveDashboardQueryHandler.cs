using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using FAMS.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.Platform.Dashboard.Queries.GetExecutiveDashboard;

public class GetExecutiveDashboardQueryHandler
    : IRequestHandler<GetExecutiveDashboardQuery, Result<ExecutiveDashboardDto>>
{
    private readonly IFamsDbContext _db;

    public GetExecutiveDashboardQueryHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<ExecutiveDashboardDto>> Handle(
        GetExecutiveDashboardQuery request, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var nextMonth = monthStart.AddMonths(1);

        var campuses = await _db.Campuses.AsNoTracking()
            .Select(c => new { c.Id, c.Name })
            .ToListAsync(cancellationToken);

        var enrolled = await _db.Students.AsNoTracking()
            .Where(s => s.Status == StudentStatus.Enrolled || s.Status == StudentStatus.Active)
            .GroupBy(s => s.CampusId)
            .Select(g => new { CampusId = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var activeStaff = await _db.StaffMembers.AsNoTracking()
            .Where(s => s.IsActive)
            .GroupBy(s => s.CampusId)
            .Select(g => new { CampusId = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var monthlyRevenue = await _db.FeePayments.AsNoTracking()
            .Where(p => p.CreatedAt >= monthStart && p.CreatedAt < nextMonth)
            .GroupBy(p => p.CampusId)
            .Select(g => new { CampusId = g.Key, Revenue = g.Sum(p => p.Amount) })
            .ToListAsync(cancellationToken);

        var outstanding = await _db.FeeInvoices.AsNoTracking()
            .Where(i => i.Status == PaymentStatus.Pending || i.Status == PaymentStatus.PartiallyPaid || i.Status == PaymentStatus.Overdue)
            .GroupBy(i => i.CampusId)
            .Select(g => new { CampusId = g.Key, Outstanding = g.Sum(i => i.TotalAmount + i.LateFee - i.Discount - i.PaidAmount) })
            .ToListAsync(cancellationToken);

        var applicationsThisMonth = await _db.Applications.AsNoTracking()
            .CountAsync(a => a.CreatedAt >= monthStart && a.CreatedAt < nextMonth, cancellationToken);

        var breakdown = campuses.Select(c => new CampusKpi(
            c.Id,
            c.Name,
            enrolled.FirstOrDefault(e => e.CampusId == c.Id)?.Count ?? 0,
            activeStaff.FirstOrDefault(s => s.CampusId == c.Id)?.Count ?? 0,
            monthlyRevenue.FirstOrDefault(r => r.CampusId == c.Id)?.Revenue ?? 0,
            outstanding.FirstOrDefault(o => o.CampusId == c.Id)?.Outstanding ?? 0))
            .OrderByDescending(c => c.EnrolledStudents)
            .ToList();

        var dto = new ExecutiveDashboardDto(
            campuses.Count,
            breakdown.Sum(c => c.EnrolledStudents),
            breakdown.Sum(c => c.ActiveStaff),
            applicationsThisMonth,
            breakdown.Sum(c => c.MonthlyRevenue),
            breakdown.Sum(c => c.OutstandingFees),
            breakdown);

        return Result<ExecutiveDashboardDto>.Success(dto);
    }
}
