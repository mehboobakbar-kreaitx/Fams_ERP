using FAMS.Domain.Common;
using FAMS.Domain.Enums;

namespace FAMS.Domain.Entities;

public class Student : BaseAuditableEntity
{
    public string FirstName { get; private set; } = string.Empty;
    public string LastName { get; private set; } = string.Empty;
    public string FatherName { get; private set; } = string.Empty;
    public DateTime DateOfBirth { get; private set; }
    public Gender Gender { get; private set; }
    public string? NIC { get; private set; }
    public string? BForm { get; private set; }
    public string? Photo { get; private set; }
    public string Address { get; private set; } = string.Empty;
    public string Phone { get; private set; } = string.Empty;
    public string? Email { get; private set; }
    public DateTime EnrollmentDate { get; private set; }
    public StudentStatus Status { get; private set; } = StudentStatus.Prospect;
    public Guid ProgramId { get; private set; }
    public Guid ClassId { get; private set; }
    public Guid SectionId { get; private set; }
    public string RollNumber { get; private set; } = string.Empty;
    public string EmergencyContactName { get; private set; } = string.Empty;
    public string EmergencyContactPhone { get; private set; } = string.Empty;
    public string? MedicalNotes { get; private set; }
    public string? BloodGroup { get; private set; }
    public Guid? ParentId { get; private set; }

    public Campus Campus { get; private set; } = null!;
    public Parent? Parent { get; private set; }
    public ICollection<Attendance> Attendances { get; private set; } = new List<Attendance>();
    public ICollection<FeeInvoice> FeeInvoices { get; private set; } = new List<FeeInvoice>();
    public ICollection<Result> Results { get; private set; } = new List<Result>();

    private Student() { }

    public static Student Create(string firstName, string lastName, string fatherName,
        DateTime dateOfBirth, Gender gender, string address, string phone,
        Guid programId, Guid classId, Guid sectionId, string rollNumber,
        string emergencyContactName, string emergencyContactPhone,
        string? nic = null, string? bForm = null, string? email = null, string? bloodGroup = null)
    {
        return new Student
        {
            FirstName = firstName,
            LastName = lastName,
            FatherName = fatherName,
            DateOfBirth = dateOfBirth,
            Gender = gender,
            NIC = nic,
            BForm = bForm,
            Address = address,
            Phone = phone,
            Email = email,
            EnrollmentDate = DateTime.UtcNow,
            Status = StudentStatus.Enrolled,
            ProgramId = programId,
            ClassId = classId,
            SectionId = sectionId,
            RollNumber = rollNumber,
            EmergencyContactName = emergencyContactName,
            EmergencyContactPhone = emergencyContactPhone,
            BloodGroup = bloodGroup
        };
    }

    public void UpdateDetails(string firstName, string lastName, string address, string phone,
        string? email, string emergencyContactName, string emergencyContactPhone,
        string? medicalNotes, string? bloodGroup)
    {
        FirstName = firstName;
        LastName = lastName;
        Address = address;
        Phone = phone;
        Email = email;
        EmergencyContactName = emergencyContactName;
        EmergencyContactPhone = emergencyContactPhone;
        MedicalNotes = medicalNotes;
        BloodGroup = bloodGroup;
    }

    public void ChangeStatus(StudentStatus newStatus) => Status = newStatus;
    public void AssignParent(Guid parentId) => ParentId = parentId;
    public void UpdatePhoto(string photoUrl) => Photo = photoUrl;
}
