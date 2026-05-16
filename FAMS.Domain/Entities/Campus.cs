using FAMS.Domain.Common;

namespace FAMS.Domain.Entities;

public class Campus : BaseAuditableEntity
{
    public string Name { get; private set; } = string.Empty;
    public string Code { get; private set; } = string.Empty;
    public string City { get; private set; } = string.Empty;
    public string Address { get; private set; } = string.Empty;
    public string Phone { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string PrincipalName { get; private set; } = string.Empty;
    public bool IsActive { get; private set; } = true;
    public bool IsMainCampus { get; private set; }
    public int MaxCapacity { get; private set; }

    public ICollection<Student> Students { get; private set; } = new List<Student>();
    public ICollection<Staff> StaffMembers { get; private set; } = new List<Staff>();

    private Campus() { }

    public static Campus Create(string name, string code, string city, string address,
        string phone, string email, string principalName, int maxCapacity, bool isMainCampus = false)
    {
        return new Campus
        {
            Name = name,
            Code = code,
            City = city,
            Address = address,
            Phone = phone,
            Email = email,
            PrincipalName = principalName,
            MaxCapacity = maxCapacity,
            IsMainCampus = isMainCampus,
            IsActive = true
        };
    }

    public void Update(string name, string address, string phone, string email, string principalName, int maxCapacity)
    {
        Name = name;
        Address = address;
        Phone = phone;
        Email = email;
        PrincipalName = principalName;
        MaxCapacity = maxCapacity;
    }

    public void MarkAsMainCampus() => IsMainCampus = true;
    public void Deactivate() => IsActive = false;
}
