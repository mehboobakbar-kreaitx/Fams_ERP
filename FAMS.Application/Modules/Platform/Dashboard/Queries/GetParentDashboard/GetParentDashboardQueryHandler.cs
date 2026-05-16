using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using FAMS.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.Platform.Dashboard.Queries.GetParentDashboard;

public class GetParentDashboardQueryHandler
    : IRequestHandler<GetParentDashboardQuery, Result<ParentDashboardDto>>
{
    private readonly IFamsDbContext _db;

    public GetParentDashboardQueryHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<ParentDashboardDto>> Handle(
        GetParentDashboardQuery request, CancellationToken cancellationToken)
    {
        var parent = await _db.Parents.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == request.ParentId, cancellationToken);
        if (parent is null)
            return Result<ParentDashboardDto>.Failure("Parent record not found.");

        var children = await _db.Students.AsNoTracking()
            .Where(s => s.ParentId == request.ParentId)
            .Select(s => new { s.Id, s.FirstName, s.LastName, s.RollNumber, s.ClassId, s.SectionId })
            .ToListAsync(cancellationToken);

        var classNames = await _db.ClassRooms.AsNoTracking()
            .Where(c => children.Select(ch => ch.ClassId).Contains(c.Id))
            .ToDictionaryAsync(c => c.Id, c => c.Name, cancellationToken);

        var sectionNames = await _db.Sections.AsNoTracking()
            .Where(s => children.Select(ch => ch.SectionId).Contains(s.Id))
            .ToDictionaryAsync(s => s.Id, s => s.Name, cancellationToken);

        var thirtyDaysAgo = DateTime.UtcNow.Date.AddDays(-30);
        var childIds = children.Select(c => c.Id).ToList();

        var attRecs = await _db.Attendances.AsNoTracking()
            .Where(a => a.StudentId != null && childIds.Contains(a.StudentId.Value) && a.Date >= thirtyDaysAgo)
            .GroupBy(a => a.StudentId)
            .Select(g => new { StudentId = g.Key, Total = g.Count(), Present = g.Count(x => x.IsPresent) })
            .ToListAsync(cancellationToken);

        var balances = await _db.FeeInvoices.AsNoTracking()
            .Where(i => childIds.Contains(i.StudentId) &&
                (i.Status == PaymentStatus.Pending || i.Status == PaymentStatus.PartiallyPaid || i.Status == PaymentStatus.Overdue))
            .GroupBy(i => i.StudentId)
            .Select(g => new { StudentId = g.Key, Balance = g.Sum(i => i.TotalAmount + i.LateFee - i.Discount - i.PaidAmount) })
            .ToListAsync(cancellationToken);

        var resultCounts = await _db.Results.AsNoTracking()
            .Where(r => childIds.Contains(r.StudentId) && r.IsPublished)
            .GroupBy(r => r.StudentId)
            .Select(g => new { StudentId = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var summaries = children.Select(c =>
        {
            var att = attRecs.FirstOrDefault(a => a.StudentId == c.Id);
            var attPct = att is null || att.Total == 0 ? 0m
                : Math.Round((decimal)att.Present / att.Total * 100m, 2);
            return new ChildSummary(
                c.Id,
                c.FirstName + " " + c.LastName,
                c.RollNumber,
                classNames.GetValueOrDefault(c.ClassId, string.Empty),
                sectionNames.GetValueOrDefault(c.SectionId, string.Empty),
                attPct,
                balances.FirstOrDefault(b => b.StudentId == c.Id)?.Balance ?? 0,
                resultCounts.FirstOrDefault(r => r.StudentId == c.Id)?.Count ?? 0);
        }).ToList();

        var dto = new ParentDashboardDto(
            request.ParentId,
            parent.FirstName + " " + parent.LastName,
            children.Count,
            summaries.Sum(s => s.FeeBalance),
            summaries);

        return Result<ParentDashboardDto>.Success(dto);
    }
}
