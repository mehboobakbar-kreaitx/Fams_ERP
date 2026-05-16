using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using FAMS.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.Finance.Payroll.Commands.ApprovePayroll;

public class ApprovePayrollCommandHandler : IRequestHandler<ApprovePayrollCommand, Result<int>>
{
    private readonly IFamsDbContext _db;

    public ApprovePayrollCommandHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<int>> Handle(ApprovePayrollCommand request, CancellationToken cancellationToken)
    {
        var drafts = await _db.Payrolls
            .Where(p => p.CampusId == request.CampusId
                     && p.Year == request.Year
                     && p.Month == request.Month
                     && p.Status == PayrollStatus.Draft)
            .ToListAsync(cancellationToken);

        if (drafts.Count == 0)
            return Result<int>.Failure("No draft payrolls found for the supplied period.");

        foreach (var p in drafts) p.Approve(request.ApprovedBy);

        await _db.SaveChangesAsync(cancellationToken);
        return Result<int>.Success(drafts.Count);
    }
}
