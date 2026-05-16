using FAMS.Domain.Common;

namespace FAMS.Domain.Entities;

public class AcademicTerm : BaseAuditableEntity
{
    public string Name { get; private set; } = string.Empty;
    public DateTime StartDate { get; private set; }
    public DateTime EndDate { get; private set; }
    public bool IsActive { get; private set; } = true;

    public ICollection<Holiday> Holidays { get; private set; } = new List<Holiday>();

    private AcademicTerm() { }

    public static AcademicTerm Create(string name, DateTime startDate, DateTime endDate)
    {
        if (endDate <= startDate) throw new ArgumentException("End date must be after start date.");
        return new AcademicTerm
        {
            Name = name,
            StartDate = DateTime.SpecifyKind(startDate, DateTimeKind.Utc),
            EndDate = DateTime.SpecifyKind(endDate, DateTimeKind.Utc),
            IsActive = true,
        };
    }

    public void Deactivate() => IsActive = false;
    public void Reactivate() => IsActive = true;
}
