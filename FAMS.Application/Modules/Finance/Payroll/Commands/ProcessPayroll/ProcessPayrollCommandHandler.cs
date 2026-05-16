using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PayrollEntity = FAMS.Domain.Entities.Payroll;

namespace FAMS.Application.Modules.Finance.Payroll.Commands.ProcessPayroll;

public class ProcessPayrollCommandHandler : IRequestHandler<ProcessPayrollCommand, Result<int>>
{
    private readonly IFamsDbContext _db;

    public ProcessPayrollCommandHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<int>> Handle(ProcessPayrollCommand request, CancellationToken cancellationToken)
    {
        var activeStaff = await _db.StaffMembers
            .Where(s => s.CampusId == request.CampusId && s.IsActive)
            .ToListAsync(cancellationToken);

        if (activeStaff.Count == 0)
            return Result<int>.Failure("No active staff found for this campus.");

        var existing = await _db.Payrolls
            .Where(p => p.Year == request.Year && p.Month == request.Month && p.CampusId == request.CampusId)
            .Select(p => p.StaffId)
            .ToListAsync(cancellationToken);

        var existingSet = existing.ToHashSet();
        var adjustments = (request.Adjustments ?? Array.Empty<StaffAdjustment>())
            .ToDictionary(a => a.StaffId);

        int generated = 0;
        foreach (var staff in activeStaff)
        {
            if (existingSet.Contains(staff.Id)) continue;

            var allowances = 0m;
            var deductions = 0m;
            if (adjustments.TryGetValue(staff.Id, out var adj))
            {
                allowances = adj.Allowances;
                deductions = adj.Deductions;
            }

            var eobi = PayrollCalculator.CalculateEobi(staff.BasicSalary);
            var annualTaxable = (staff.BasicSalary + allowances) * 12m;
            var tax = PayrollCalculator.CalculateMonthlyIncomeTax(annualTaxable);

            var payroll = PayrollEntity.Create(staff.Id, request.Year, request.Month,
                staff.BasicSalary, allowances, deductions, eobi, tax);
            payroll.CampusId = request.CampusId;
            _db.Payrolls.Add(payroll);
            generated++;
        }

        await _db.SaveChangesAsync(cancellationToken);
        return Result<int>.Success(generated);
    }
}
