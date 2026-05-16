using FAMS.Domain.Common;

namespace FAMS.Domain.Entities;

public class Holiday : BaseAuditableEntity
{
    public Guid TermId { get; private set; }
    public DateTime Date { get; private set; }
    public string Description { get; private set; } = string.Empty;

    public AcademicTerm Term { get; private set; } = null!;

    private Holiday() { }

    public static Holiday Create(Guid termId, DateTime date, string description)
    {
        return new Holiday
        {
            TermId = termId,
            Date = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc),
            Description = description,
        };
    }
}
