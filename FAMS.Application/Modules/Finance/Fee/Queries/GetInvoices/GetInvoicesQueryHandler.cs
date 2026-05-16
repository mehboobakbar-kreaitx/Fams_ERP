using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.Finance.Fee.Queries.GetInvoices;

public class GetInvoicesQueryHandler : IRequestHandler<GetInvoicesQuery, Result<PaginatedList<InvoiceDto>>>
{
    private readonly IFamsDbContext _db;

    public GetInvoicesQueryHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<PaginatedList<InvoiceDto>>> Handle(GetInvoicesQuery request, CancellationToken cancellationToken)
    {
        var query = _db.FeeInvoices.AsNoTracking().Include(i => i.Student)
            .Where(i => i.CampusId == request.CampusId);

        if (request.StudentId.HasValue) query = query.Where(i => i.StudentId == request.StudentId.Value);
        if (request.Status.HasValue) query = query.Where(i => i.Status == request.Status.Value);
        if (!string.IsNullOrWhiteSpace(request.TermName)) query = query.Where(i => i.TermName == request.TermName);

        var projected = query
            .OrderByDescending(i => i.IssueDate)
            .Select(i => new InvoiceDto(
                i.Id, i.InvoiceNumber, i.StudentId,
                i.Student.FirstName + " " + i.Student.LastName,
                i.TermName, i.TotalAmount, i.PaidAmount, i.LateFee, i.Discount,
                i.TotalAmount + i.LateFee - i.Discount - i.PaidAmount,
                i.Status, i.IssueDate, i.DueDate));

        var paged = await PaginatedList<InvoiceDto>.CreateAsync(projected, request.PageNumber, request.PageSize, cancellationToken);
        return Result<PaginatedList<InvoiceDto>>.Success(paged);
    }
}
