using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.HRM.Leaves.Queries.GetLeaves;

public class GetLeavesQueryHandler : IRequestHandler<GetLeavesQuery, Result<PaginatedList<LeaveDto>>>
{
    private readonly IFamsDbContext _db;

    public GetLeavesQueryHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<PaginatedList<LeaveDto>>> Handle(GetLeavesQuery request, CancellationToken cancellationToken)
    {
        var query = _db.Leaves.AsNoTracking().Include(l => l.Staff)
            .Where(l => l.CampusId == request.CampusId);
        if (request.StaffId.HasValue) query = query.Where(l => l.StaffId == request.StaffId.Value);
        if (!string.IsNullOrWhiteSpace(request.Status)) query = query.Where(l => l.Status == request.Status);

        var projected = query
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => new LeaveDto(
                l.Id, l.StaffId, l.Staff.FirstName + " " + l.Staff.LastName,
                l.LeaveType, l.StartDate, l.EndDate, l.TotalDays, l.Reason,
                l.Status, l.ApprovedAt, l.Remarks));

        var paged = await PaginatedList<LeaveDto>.CreateAsync(projected, request.PageNumber, request.PageSize, cancellationToken);
        return Result<PaginatedList<LeaveDto>>.Success(paged);
    }
}
