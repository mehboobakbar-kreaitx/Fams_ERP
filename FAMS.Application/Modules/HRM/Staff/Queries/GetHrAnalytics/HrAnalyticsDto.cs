namespace FAMS.Application.Modules.HRM.Staff.Queries.GetHrAnalytics;

public record DepartmentHeadcountItem(string Department, int ActiveCount, int InactiveCount);

public record EmploymentTypeItem(string EmploymentType, int Count);

public record HrAnalyticsDto(
    int TotalStaff,
    int ActiveStaff,
    int InactiveStaff,
    int PendingLeaves,
    int ApprovedLeavesThisMonth,
    decimal TotalMonthlyPayrollCost,
    IReadOnlyList<DepartmentHeadcountItem> DepartmentHeadcount,
    IReadOnlyList<EmploymentTypeItem> EmploymentTypeBreakdown);
