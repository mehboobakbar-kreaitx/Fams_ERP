using FAMS.Domain.Common;
using FAMS.Domain.Enums;

namespace FAMS.Domain.Entities;

public class Payroll : BaseAuditableEntity
{
    public Guid StaffId { get; private set; }
    public int Year { get; private set; }
    public int Month { get; private set; }
    public decimal BasicSalary { get; private set; }
    public decimal Allowances { get; private set; }
    public decimal Deductions { get; private set; }
    public decimal EobiContribution { get; private set; }
    public decimal IncomeTax { get; private set; }
    public decimal GrossSalary { get; private set; }
    public decimal NetSalary { get; private set; }
    public PayrollStatus Status { get; private set; } = PayrollStatus.Draft;
    public DateTime? ApprovedAt { get; private set; }
    public string? ApprovedBy { get; private set; }
    public DateTime? PaidAt { get; private set; }
    public string? Remarks { get; private set; }

    public Staff Staff { get; private set; } = null!;

    private Payroll() { }

    public static Payroll Create(Guid staffId, int year, int month,
        decimal basicSalary, decimal allowances, decimal deductions,
        decimal eobiContribution, decimal incomeTax, string? remarks = null)
    {
        var gross = basicSalary + allowances;
        var net = gross - deductions - eobiContribution - incomeTax;
        return new Payroll
        {
            StaffId = staffId,
            Year = year,
            Month = month,
            BasicSalary = basicSalary,
            Allowances = allowances,
            Deductions = deductions,
            EobiContribution = eobiContribution,
            IncomeTax = incomeTax,
            GrossSalary = gross,
            NetSalary = net,
            Status = PayrollStatus.Draft,
            Remarks = remarks
        };
    }

    public void Approve(string approvedBy)
    {
        if (Status != PayrollStatus.Draft)
            throw new InvalidOperationException($"Cannot approve payroll in status {Status}.");
        Status = PayrollStatus.Approved;
        ApprovedAt = DateTime.UtcNow;
        ApprovedBy = approvedBy;
    }

    public void MarkPaid()
    {
        if (Status != PayrollStatus.Approved)
            throw new InvalidOperationException($"Cannot mark payroll paid from status {Status}.");
        Status = PayrollStatus.Paid;
        PaidAt = DateTime.UtcNow;
    }

    public void Cancel(string reason)
    {
        if (Status == PayrollStatus.Paid)
            throw new InvalidOperationException("Cannot cancel a paid payroll.");
        Status = PayrollStatus.Cancelled;
        Remarks = reason;
    }
}
