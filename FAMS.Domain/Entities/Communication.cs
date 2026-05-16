using FAMS.Domain.Common;

namespace FAMS.Domain.Entities;

public enum CommunicationChannel { Sms = 1, Email = 2, InApp = 3 }
public enum CommunicationStatus { Pending = 1, Sent = 2, Failed = 3 }
public enum RecipientType { Student = 1, Parent = 2, Staff = 3 }

public class Communication : BaseAuditableEntity
{
    public Guid RecipientId { get; private set; }
    public RecipientType RecipientType { get; private set; }
    public CommunicationChannel Channel { get; private set; }
    public string Subject { get; private set; } = string.Empty;
    public string Body { get; private set; } = string.Empty;
    public DateTime SentAt { get; private set; }
    public Guid? SentByUserId { get; private set; }
    public CommunicationStatus Status { get; private set; } = CommunicationStatus.Pending;
    public string? ErrorDetail { get; private set; }

    private Communication() { }

    public static Communication Log(Guid recipientId, RecipientType recipientType, CommunicationChannel channel,
        string subject, string body, Guid? sentByUserId, CommunicationStatus status, string? error = null)
        => new()
        {
            RecipientId = recipientId,
            RecipientType = recipientType,
            Channel = channel,
            Subject = subject,
            Body = body,
            SentAt = DateTime.UtcNow,
            SentByUserId = sentByUserId,
            Status = status,
            ErrorDetail = error,
        };
}
