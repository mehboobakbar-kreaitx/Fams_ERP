using FAMS.Domain.Common;

namespace FAMS.Domain.Entities;

public enum ContractType { Permanent = 1, FixedTerm = 2, Probation = 3, Consultant = 4 }

public class EmploymentContract : BaseAuditableEntity
{
    public Guid StaffId { get; private set; }
    public ContractType Type { get; private set; }
    public DateTime StartDate { get; private set; }
    public DateTime? EndDate { get; private set; }
    public DateTime? RenewalDueDate { get; private set; }
    public bool IsActive { get; private set; } = true;
    public string? Notes { get; private set; }

    public Staff Staff { get; private set; } = null!;

    private EmploymentContract() { }

    public static EmploymentContract Create(Guid staffId, ContractType type, DateTime start, DateTime? end = null, string? notes = null)
        => new()
        {
            StaffId = staffId,
            Type = type,
            StartDate = DateTime.SpecifyKind(start, DateTimeKind.Utc),
            EndDate = end.HasValue ? DateTime.SpecifyKind(end.Value, DateTimeKind.Utc) : null,
            RenewalDueDate = end.HasValue ? DateTime.SpecifyKind(end.Value.AddDays(-30), DateTimeKind.Utc) : null,
            Notes = notes,
            IsActive = true,
        };

    public void Close() => IsActive = false;
}
