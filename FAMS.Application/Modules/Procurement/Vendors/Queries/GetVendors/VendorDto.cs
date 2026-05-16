namespace FAMS.Application.Modules.Procurement.Vendors.Queries.GetVendors;

public record VendorDto(
    Guid Id,
    string Name,
    string ContactPerson,
    string Phone,
    string? Email,
    string Category,
    string PaymentTerms,
    bool IsApproved,
    decimal Rating);
