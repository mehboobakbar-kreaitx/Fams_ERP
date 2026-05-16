using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Procurement.Vendors.Commands.CreateVendor;

public record CreateVendorCommand(
    string Name,
    string ContactPerson,
    string Phone,
    string Address,
    string Category,
    string PaymentTerms,
    string? Email = null,
    string? NTN = null) : IRequest<Result<Guid>>;
