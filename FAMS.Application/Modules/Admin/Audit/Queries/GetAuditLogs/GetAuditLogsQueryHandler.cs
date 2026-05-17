using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.Admin.Audit.Queries.GetAuditLogs;

public class GetAuditLogsQueryHandler
    : IRequestHandler<GetAuditLogsQuery, Result<IReadOnlyList<AuditLogDto>>>
{
    private readonly IFamsDbContext _db;
    public GetAuditLogsQueryHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<IReadOnlyList<AuditLogDto>>> Handle(
        GetAuditLogsQuery request, CancellationToken cancellationToken)
    {
        var query = _db.AuditLogs.AsNoTracking()
            .Where(a => !a.IsDeleted);

        if (!string.IsNullOrWhiteSpace(request.Action))
            query = query.Where(a => a.Action == request.Action);

        if (request.FromDate.HasValue)
            query = query.Where(a => a.Timestamp >= request.FromDate.Value.Date);

        if (request.ToDate.HasValue)
            query = query.Where(a => a.Timestamp < request.ToDate.Value.Date.AddDays(1));

        var rows = await query
            .OrderByDescending(a => a.Timestamp)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .GroupJoin(
                _db.Campuses.AsNoTracking(),
                a => a.CampusId,
                c => c.Id,
                (a, campuses) => new { Log = a, Campuses = campuses })
            .SelectMany(
                x => x.Campuses.DefaultIfEmpty(),
                (x, campus) => new AuditLogDto(
                    x.Log.Id,
                    x.Log.Timestamp,
                    x.Log.UserName,
                    null,
                    x.Log.Action,
                    x.Log.EntityName,
                    x.Log.EntityId,
                    campus != null ? campus.Name : null,
                    x.Log.IpAddress,
                    x.Log.NewValues))
            .ToListAsync(cancellationToken);

        return Result<IReadOnlyList<AuditLogDto>>.Success(rows);
    }
}
