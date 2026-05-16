using FAMS.Domain.Common;

namespace FAMS.Domain.Entities;

public class Vendor : BaseAuditableEntity
{
    public string Name { get; private set; } = string.Empty;
    public string ContactPerson { get; private set; } = string.Empty;
    public string Phone { get; private set; } = string.Empty;
    public string? Email { get; private set; }
    public string Address { get; private set; } = string.Empty;
    public string? NTN { get; private set; }
    public string Category { get; private set; } = string.Empty;
    public string PaymentTerms { get; private set; } = string.Empty;
    public bool IsApproved { get; private set; }
    public decimal Rating { get; private set; }

    private Vendor() { }

    public static Vendor Create(string name, string contactPerson, string phone, string address,
        string category, string paymentTerms, string? email = null, string? ntn = null)
    {
        return new Vendor
        {
            Name = name,
            ContactPerson = contactPerson,
            Phone = phone,
            Email = email,
            Address = address,
            NTN = ntn,
            Category = category,
            PaymentTerms = paymentTerms,
            IsApproved = false,
            Rating = 0m
        };
    }

    public void Approve() => IsApproved = true;
    public void UpdateRating(decimal newRating) => Rating = newRating;
}
