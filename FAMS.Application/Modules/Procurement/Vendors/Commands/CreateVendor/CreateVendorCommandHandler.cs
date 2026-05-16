using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using FAMS.Domain.Entities;
using MediatR;

namespace FAMS.Application.Modules.Procurement.Vendors.Commands.CreateVendor;

public class CreateVendorCommandHandler : IRequestHandler<CreateVendorCommand, Result<Guid>>
{
    private readonly IFamsDbContext _db;

    public CreateVendorCommandHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<Guid>> Handle(CreateVendorCommand request, CancellationToken cancellationToken)
    {
        var vendor = Vendor.Create(request.Name, request.ContactPerson, request.Phone, request.Address,
            request.Category, request.PaymentTerms, request.Email, request.NTN);
        _db.Vendors.Add(vendor);
        await _db.SaveChangesAsync(cancellationToken);
        return Result<Guid>.Success(vendor.Id);
    }
}
