using FAMS.Domain.Common;
using FAMS.Domain.Enums;

namespace FAMS.Domain.Entities;

public class Leave : BaseAuditableEntity
{
    public Guid StaffId { get; private set; }
    public LeaveType LeaveType { get; private set; }
    public DateTime StartDate { get; private set; }
    public DateTime EndDate { get; private set; }
    public int TotalDays { get; private set; }
    public string Reason { get; private set; } = string.Empty;
    public string Status { get; private set; } = "Pending";
    public Guid? ApprovedById { get; private set; }
    public DateTime? ApprovedAt { get; private set; }
    public string? Remarks { get; private set; }

    public Staff Staff { get; private set; } = null!;

    private Leave() { }

    public static Leave Create(Guid staffId, LeaveType leaveType, DateTime startDate, DateTime endDate, string reason)
    {
        var totalDays = (endDate.Date - startDate.Date).Days + 1;
        return new Leave
        {
            StaffId = staffId,
            LeaveType = leaveType,
            StartDate = startDate,
            EndDate = endDate,
            TotalDays = totalDays,
            Reason = reason,
            Status = "Pending"
        };
    }

    public void Approve(Guid approvedById, string? remarks = null)
    {
        Status = "Approved";
        ApprovedById = approvedById;
        ApprovedAt = DateTime.UtcNow;
        Remarks = remarks;
    }

    public void Reject(Guid rejectedById, string? remarks = null)
    {
        Status = "Rejected";
        ApprovedById = rejectedById;
        ApprovedAt = DateTime.UtcNow;
        Remarks = remarks;
    }
}
