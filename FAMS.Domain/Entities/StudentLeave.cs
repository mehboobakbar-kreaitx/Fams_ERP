using FAMS.Domain.Common;
using FAMS.Domain.Enums;

namespace FAMS.Domain.Entities;

public class StudentLeave : BaseAuditableEntity
{
    public Guid StudentId { get; private set; }
    public DateTime StartDate { get; private set; }
    public DateTime EndDate { get; private set; }
    public LeaveType Type { get; private set; }
    public string Reason { get; private set; } = string.Empty;
    public string? DocumentUrl { get; private set; }
    public string Status { get; private set; } = "Pending"; // Pending / Approved / Rejected
    public Guid? ReviewedById { get; private set; }
    public DateTime? ReviewedAt { get; private set; }
    public string? ReviewNotes { get; private set; }

    public Student Student { get; private set; } = null!;

    private StudentLeave() { }

    public static StudentLeave Apply(Guid studentId, DateTime start, DateTime end, LeaveType type, string reason, string? documentUrl = null)
    {
        if (end < start) throw new ArgumentException("End date must be after start date.");
        return new StudentLeave
        {
            StudentId = studentId,
            StartDate = DateTime.SpecifyKind(start.Date, DateTimeKind.Utc),
            EndDate = DateTime.SpecifyKind(end.Date, DateTimeKind.Utc),
            Type = type,
            Reason = reason,
            DocumentUrl = documentUrl,
            Status = "Pending",
        };
    }

    public void Approve(Guid reviewerId, string? notes)
    {
        Status = "Approved";
        ReviewedById = reviewerId;
        ReviewedAt = DateTime.UtcNow;
        ReviewNotes = notes;
    }

    public void Reject(Guid reviewerId, string? notes)
    {
        Status = "Rejected";
        ReviewedById = reviewerId;
        ReviewedAt = DateTime.UtcNow;
        ReviewNotes = notes;
    }
}
