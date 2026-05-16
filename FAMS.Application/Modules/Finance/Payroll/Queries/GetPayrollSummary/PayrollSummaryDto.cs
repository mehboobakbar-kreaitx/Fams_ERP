using FAMS.Domain.Enums;

namespace FAMS.Application.Modules.Finance.Payroll.Queries.GetPayrollSummary;

public record PayrollLineDto(
    Guid Id,
    Guid StaffId,
    string StaffName,
    string Designation,
    string Department,
    decimal BasicSalary,
    decimal Allowances,
    decimal Deductions,
    decimal EobiContribution,
    decimal IncomeTax,
    decimal GrossSalary,
    decimal NetSalary,
    PayrollStatus Status);

public record PayrollSummaryDto(
    int Year,
    int Month,
    int StaffCount,
    decimal TotalBasic,
    decimal TotalAllowances,
    decimal TotalDeductions,
    decimal TotalEobi,
    decimal TotalIncomeTax,
    decimal TotalGross,
    decimal TotalNet,
    int DraftCount,
    int ApprovedCount,
    int PaidCount,
    IReadOnlyList<PayrollLineDto> Lines);
