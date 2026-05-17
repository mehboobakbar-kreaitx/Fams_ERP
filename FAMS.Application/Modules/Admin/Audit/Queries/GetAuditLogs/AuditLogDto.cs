namespace FAMS.Application.Modules.Admin.Audit.Queries.GetAuditLogs;

public record AuditLogDto(
    Guid Id,
    DateTime Timestamp,
    string ActorName,
    string? ActorEmail,
    string Action,
    string? EntityType,
    string? EntityId,
    string? CampusName,
    string? IpAddress,
    string? Details);
