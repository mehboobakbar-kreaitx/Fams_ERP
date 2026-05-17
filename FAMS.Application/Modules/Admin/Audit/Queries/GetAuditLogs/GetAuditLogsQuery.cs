using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Admin.Audit.Queries.GetAuditLogs;

public record GetAuditLogsQuery(
    string? Action = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    int PageNumber = 1,
    int PageSize = 25) : IRequest<Result<IReadOnlyList<AuditLogDto>>>;
