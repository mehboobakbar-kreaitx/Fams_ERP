using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.Procurement.Vendors.Queries.GetVendors;

public class GetVendorsQueryHandler : IRequestHandler<GetVendorsQuery, Result<List<VendorDto>>>
{
    private readonly IFamsDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetVendorsQueryHandler(IFamsDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<Result<List<VendorDto>>> Handle(GetVendorsQuery request, CancellationToken cancellationToken)
    {
        if (_currentUser.SchoolId.HasValue &&
            !await _db.Campuses.AnyAsync(c => c.Id == request.CampusId, cancellationToken))
            return Result<List<VendorDto>>.Failure("Campus not found or not accessible.");

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
