using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using FAMS.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.Finance.Payroll.Queries.GetPayrollSummary;

public class GetPayrollSummaryQueryHandler
    : IRequestHandler<GetPayrollSummaryQuery, Result<PayrollSummaryDto>>
{
    private readonly IFamsDbContext _db;

    public GetPayrollSummaryQueryHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<PayrollSummaryDto>> Handle(
        GetPayrollSummaryQuery request, CancellationToken cancellationToken)
    {
        var rows = await _db.Payrolls.AsNoTracking()
            .Where(p => p.CampusId == request.CampusId && p.Year == request.Year && p.Month == request.Month)
            .Join(_db.StaffMembers, p => p.StaffId, s => s.Id,
                (p, s) => new PayrollLineDto(
                    p.Id, p.StaffId, s.FirstName + " " + s.LastName, s.Designation, s.Department,
                    p.BasicSalary, p.Allowances, p.Deductions, p.EobiContribution, p.IncomeTax,
                    p.GrossSalary, p.NetSalary, p.Status))
            .OrderBy(l => l.Department).ThenBy(l => l.StaffName)
            .ToListAsync(cancellationToken);

        var dto = new PayrollSummaryDto(
            request.Year,
            request.Month,
            rows.Count,
            rows.Sum(r => r.BasicSalary),
            rows.Sum(r => r.Allowances),
            rows.Sum(r => r.Deductions),
            rows.Sum(r => r.EobiContribution),
            rows.Sum(r => r.IncomeTax),
            rows.Sum(r => r.GrossSalary),
            rows.Sum(r => r.NetSalary),
            rows.Count(r => r.Status == PayrollStatus.Draft),
            rows.Count(r => r.Status == PayrollStatus.Approved),
            rows.Count(r => r.Status == PayrollStatus.Paid),
            rows);

        return Result<PayrollSummaryDto>.Success(dto);
    }
}
