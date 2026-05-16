using FAMS.Domain.Common;
using FAMS.Domain.Enums;

namespace FAMS.Domain.Entities;

public class Staff : BaseAuditableEntity
{
    public string FirstName { get; private set; } = string.Empty;
    public string LastName { get; private set; } = string.Empty;
    public string FatherName { get; private set; } = string.Empty;
    public string CNIC { get; private set; } = string.Empty;
    public string Phone { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public DateTime DateOfBirth { get; private set; }
    public Gender Gender { get; private set; }
    public DateTime JoiningDate { get; private set; }
    public string Designation { get; private set; } = string.Empty;
    public string Department { get; private set; } = string.Empty;
    public string Qualification { get; private set; } = string.Empty;
    public string? Photo { get; private set; }
    public decimal BasicSalary { get; private set; }
    public string EmploymentType { get; private set; } = "FullTime";
    public bool IsActive { get; private set; } = true;
    public Guid? ReportsToId { get; private set; }
    public Staff? ReportsTo { get; private set; }

    public Campus Campus { get; private set; } = null!;
    public ICollection<Attendance> Attendances { get; private set; } = new List<Attendance>();
    public ICollection<Leave> Leaves { get; private set; } = new List<Leave>();

    private Staff() { }

    public static Staff Create(string firstName, string lastName, string fatherName, string cnic,
        string phone, string email, DateTime dateOfBirth, Gender gender, DateTime joiningDate,
        string designation, string department, string qualification, decimal basicSalary,
        string employmentType = "FullTime")
    {
        return new Staff
        {
            FirstName = firstName,
            LastName = lastName,
            FatherName = fatherName,
            CNIC = cnic,
            Phone = phone,
            Email = email,
            DateOfBirth = dateOfBirth,
            Gender = gender,
            JoiningDate = joiningDate,
            Designation = designation,
            Department = department,
            Qualification = qualification,
            BasicSalary = basicSalary,
            EmploymentType = employmentType,
            IsActive = true
        };
    }

    public void Update(string designation, string department, decimal basicSalary, string? photo = null)
    {
        Designation = designation;
        Department = department;
        BasicSalary = basicSalary;
        if (photo != null) Photo = photo;
    }

    public void Deactivate() => IsActive = false;
    public void SetReportsTo(Guid? managerId) => ReportsToId = managerId;
}
