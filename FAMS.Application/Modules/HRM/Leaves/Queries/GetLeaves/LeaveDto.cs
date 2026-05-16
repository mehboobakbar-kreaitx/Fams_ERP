using FAMS.Domain.Enums;

namespace FAMS.Application.Modules.HRM.Leaves.Queries.GetLeaves;

public record LeaveDto(
    Guid Id,
    Guid StaffId,
    string StaffName,
    LeaveType LeaveType,
    DateTime StartDate,
    DateTime EndDate,
    int TotalDays,
    string Reason,
    string Status,
    DateTime? ApprovedAt,
    string? Remarks);
