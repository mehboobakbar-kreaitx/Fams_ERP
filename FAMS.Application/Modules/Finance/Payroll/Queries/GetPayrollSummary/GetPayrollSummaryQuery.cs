using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Finance.Payroll.Queries.GetPayrollSummary;

public record GetPayrollSummaryQuery(
    Guid CampusId,
    int Year,
    int Month) : IRequest<Result<PayrollSummaryDto>>;
