using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.Procurement.Vendors.Queries.GetVendors;

public class GetVendorsQueryHandler : IRequestHandler<GetVendorsQuery, Result<List<VendorDto>>>
{
    private readonly IFamsDbContext _db;
    public GetVendorsQueryHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<List<VendorDto>>> Handle(GetVendorsQuery request, CancellationToken cancellationToken)
    {
        var query = _db.Vendors.AsNoTracking().Where(v => v.CampusId == request.CampusId);
        if (!string.IsNullOrWhiteSpace(request.Category)) query = query.Where(v => v.Category == request.Category);
        if (request.IsApproved.HasValue) query = query.Where(v => v.IsApproved == request.IsApproved.Value);

        var list = await query
            .OrderBy(v => v.Name)
            .Select(v => new VendorDto(v.Id, v.Name, v.ContactPerson, v.Phone, v.Email,
                v.Category, v.PaymentTerms, v.IsApproved, v.Rating))
            .ToListAsync(cancellationToken);
        return Result<List<VendorDto>>.Success(list);
    }
}
