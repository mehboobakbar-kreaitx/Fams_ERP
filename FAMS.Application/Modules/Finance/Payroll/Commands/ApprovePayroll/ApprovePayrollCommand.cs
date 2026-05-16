using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Finance.Payroll.Commands.ApprovePayroll;

public record ApprovePayrollCommand(
    Guid CampusId,
    int Year,
    int Month,
    string ApprovedBy) : IRequest<Result<int>>;
