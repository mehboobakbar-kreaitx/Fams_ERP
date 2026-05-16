using FAMS.Domain.Common;

namespace FAMS.Domain.Entities;

public class Parent : BaseAuditableEntity
{
    public string FirstName { get; private set; } = string.Empty;
    public string LastName { get; private set; } = string.Empty;
    public string CNIC { get; private set; } = string.Empty;
    public string Phone { get; private set; } = string.Empty;
    public string? Email { get; private set; }
    public string Address { get; private set; } = string.Empty;
    public string? Occupation { get; private set; }
    public string Relationship { get; private set; } = "Father";
    public bool PortalAccessEnabled { get; private set; }

    public ICollection<Student> Students { get; private set; } = new List<Student>();

    private Parent() { }

    public static Parent Create(string firstName, string lastName, string cnic, string phone,
        string address, string relationship, string? email = null, string? occupation = null)
    {
        return new Parent
        {
            FirstName = firstName,
            LastName = lastName,
            CNIC = cnic,
            Phone = phone,
            Email = email,
            Address = address,
            Occupation = occupation,
            Relationship = relationship,
            PortalAccessEnabled = false
        };
    }

    public void EnablePortalAccess() => PortalAccessEnabled = true;
    public void DisablePortalAccess() => PortalAccessEnabled = false;
}
