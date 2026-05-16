using FAMS.Domain.Common;

namespace FAMS.Domain.Entities;

public enum InquiryStatus { New = 1, Contacted = 2, ApplicationStarted = 3, Converted = 4, Dropped = 5 }

public class Inquiry : BaseAuditableEntity
{
    public string CandidateName { get; private set; } = string.Empty;
    public string Phone { get; private set; } = string.Empty;
    public string? Email { get; private set; }
    public string Source { get; private set; } = string.Empty; // Walk-in / Website / Referral / Ad / Other
    public string? InquiredProgram { get; private set; }
    public InquiryStatus Status { get; private set; } = InquiryStatus.New;
    public DateTime? FollowUpDate { get; private set; }
    public Guid? AssignedToUserId { get; private set; }
    public string? Notes { get; private set; }

    private Inquiry() { }

    public static Inquiry Create(string candidateName, string phone, string source, string? email, string? inquiredProgram, string? notes)
        => new()
        {
            CandidateName = candidateName,
            Phone = phone,
            Email = email,
            Source = source,
            InquiredProgram = inquiredProgram,
            Notes = notes,
            Status = InquiryStatus.New,
        };

    public void SetStatus(InquiryStatus status) => Status = status;
    public void ScheduleFollowUp(DateTime when) => FollowUpDate = DateTime.SpecifyKind(when, DateTimeKind.Utc);
    public void AssignTo(Guid userId) => AssignedToUserId = userId;
}
