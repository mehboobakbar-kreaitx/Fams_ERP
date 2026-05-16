using FAMS.Domain.Common;

namespace FAMS.Domain.Entities;

public class School : BaseAuditableEntity
{
    public string Name { get; private set; } = string.Empty;
    public string Code { get; private set; } = string.Empty;
    public string? LogoUrl { get; private set; }
    public string? Address { get; private set; }
    public string City { get; private set; } = string.Empty;
    public string? Phone { get; private set; }
    public string? Email { get; private set; }
    public string? Website { get; private set; }
    public bool IsActive { get; private set; } = true;

    public ICollection<Campus> Campuses { get; private set; } = new List<Campus>();

    private School() { }

    public static School Create(string name, string code, string city,
        string? address = null, string? phone = null, string? email = null,
        string? website = null, string? logoUrl = null)
    {
        return new School
        {
            Name = name,
            Code = code,
            City = city,
            Address = address,
            Phone = phone,
            Email = email,
            Website = website,
            LogoUrl = logoUrl,
            IsActive = true
        };
    }

    public void Update(string name, string city, string? address, string? phone,
        string? email, string? website, string? logoUrl)
    {
        Name = name;
        City = city;
        Address = address;
        Phone = phone;
        Email = email;
        Website = website;
        LogoUrl = logoUrl;
    }

    public void Deactivate() => IsActive = false;
    public void Activate() => IsActive = true;
}
