using FAMS.Domain.Common;
using FAMS.Domain.Enums;

namespace FAMS.Domain.Entities;

public class Application : BaseAuditableEntity
{
    public string FirstName { get; private set; } = string.Empty;
    public string LastName { get; private set; } = string.Empty;
    public string FatherName { get; private set; } = string.Empty;
    public DateTime DateOfBirth { get; private set; }
    public Gender Gender { get; private set; }
    public string Phone { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string Address { get; private set; } = string.Empty;
    public Guid ProgramId { get; private set; }
    public List<string> DocumentUrls { get; private set; } = new();
    public ApplicationStatus Status { get; private set; } = ApplicationStatus.Applied;
    public decimal? TestMarks { get; private set; }
    public string? ReviewNotes { get; private set; }
    public Guid? ReviewedById { get; private set; }
    public DateTime? ReviewedAt { get; private set; }
    public int? Rank { get; private set; }

    private Application() { }

    public static Application Create(string firstName, string lastName, string fatherName,
        DateTime dateOfBirth, Gender gender, string phone, string email, string address,
        Guid programId, Guid campusId, List<string>? documentUrls = null)
    {
        var app = new Application
        {
            FirstName = firstName,
            LastName = lastName,
            FatherName = fatherName,
            DateOfBirth = dateOfBirth,
            Gender = gender,
            Phone = phone,
            Email = email,
            Address = address,
            ProgramId = programId,
            Status = ApplicationStatus.Applied,
            DocumentUrls = documentUrls ?? new List<string>()
        };
        app.CampusId = campusId;
        return app;
    }

    public void Review(ApplicationStatus newStatus, string notes, Guid reviewedById)
    {
        Status = newStatus;
        ReviewNotes = notes;
        ReviewedById = reviewedById;
        ReviewedAt = DateTime.UtcNow;
    }

    public void SetTestMarks(decimal marks) => TestMarks = marks;
    public void AssignRank(int rank) => Rank = rank;
}
