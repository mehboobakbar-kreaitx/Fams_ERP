using FAMS.Domain.Common;

namespace FAMS.Domain.Entities;

public class Exam : BaseAuditableEntity
{
    public string Name { get; private set; } = string.Empty;
    public string ExamType { get; private set; } = string.Empty;
    public string TermName { get; private set; } = string.Empty;
    public Guid ClassId { get; private set; }
    public DateTime StartDate { get; private set; }
    public DateTime EndDate { get; private set; }
    public bool IsPublished { get; private set; }
    public DateTime? PublishedAt { get; private set; }

    public ClassRoom Class { get; private set; } = null!;
    public ICollection<ExamScheduleItem> ScheduleItems { get; private set; } = new List<ExamScheduleItem>();

    private Exam() { }

    public static Exam Create(string name, string examType, string termName,
        Guid classId, DateTime startDate, DateTime endDate)
    {
        if (endDate < startDate) throw new ArgumentException("End date must be on or after start date.");
        return new Exam
        {
            Name = name,
            ExamType = examType,
            TermName = termName,
            ClassId = classId,
            StartDate = startDate,
            EndDate = endDate,
            IsPublished = false
        };
    }

    public void Publish()
    {
        IsPublished = true;
        PublishedAt = DateTime.UtcNow;
    }
}
