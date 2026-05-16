using FAMS.Domain.Common;

namespace FAMS.Domain.Entities;

public enum ConcessionType { Merit = 1, Sibling = 2, NeedBased = 3, Staff = 4, Other = 99 }

public class FeeConcession : BaseAuditableEntity
{
    public Guid StudentId { get; private set; }
    public ConcessionType Type { get; private set; }
    public decimal Percentage { get; private set; }
    public string Justification { get; private set; } = string.Empty;
    public Guid ApprovedById { get; private set; }
    public DateTime AppliedAt { get; private set; }
    public bool IsActive { get; private set; } = true;

    public Student Student { get; private set; } = null!;

    private FeeConcession() { }

    public static FeeConcession Create(Guid studentId, ConcessionType type, decimal percentage,
        string justification, Guid approvedById)
    {
        if (percentage <= 0 || percentage > 100) throw new ArgumentException("Percentage must be 0–100.");
        return new FeeConcession
        {
            StudentId = studentId,
            Type = type,
            Percentage = percentage,
            Justification = justification,
            ApprovedById = approvedById,
            AppliedAt = DateTime.UtcNow,
            IsActive = true,
        };
    }

    public void Revoke() => IsActive = false;
}
