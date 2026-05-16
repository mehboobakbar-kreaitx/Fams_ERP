using FAMS.Domain.Common;

namespace FAMS.Domain.Entities;

public class AuditLog : BaseEntity
{
    public string EntityName { get; private set; } = string.Empty;
    public string EntityId { get; private set; } = string.Empty;
    public string Action { get; private set; } = string.Empty;
    public string? OldValues { get; private set; }
    public string? NewValues { get; private set; }
    public string UserId { get; private set; } = string.Empty;
    public string UserName { get; private set; } = string.Empty;
    public string? IpAddress { get; private set; }
    public DateTime Timestamp { get; private set; } = DateTime.UtcNow;

    private AuditLog() { }

    public static AuditLog Create(string entityName, string entityId, string action,
        string userId, string userName, string? oldValues = null, string? newValues = null, string? ipAddress = null)
    {
        return new AuditLog
        {
            EntityName = entityName,
            EntityId = entityId,
            Action = action,
            UserId = userId,
            UserName = userName,
            OldValues = oldValues,
            NewValues = newValues,
            IpAddress = ipAddress,
            Timestamp = DateTime.UtcNow
        };
    }
}
