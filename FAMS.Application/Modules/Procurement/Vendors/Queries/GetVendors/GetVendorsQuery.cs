using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Procurement.Vendors.Queries.GetVendors;

public record GetVendorsQuery(Guid CampusId, string? Category = null, bool? IsApproved = null)
    : IRequest<Result<List<VendorDto>>>;
