using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Finance.Payroll.Commands.ProcessPayroll;

public record StaffAdjustment(Guid StaffId, decimal Allowances, decimal Deductions);

public record ProcessPayrollCommand(
    Guid CampusId,
    int Year,
    int Month,
    IReadOnlyList<StaffAdjustment>? Adjustments = null) : IRequest<Result<int>>;
