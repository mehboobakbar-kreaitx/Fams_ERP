using FAMS.Domain.Common;

namespace FAMS.Domain.Entities;

public class TimetableSlot : BaseAuditableEntity
{
    public Guid SectionId { get; private set; }
    public Guid SubjectId { get; private set; }
    public Guid TeacherId { get; private set; }
    public DayOfWeek DayOfWeek { get; private set; }
    public TimeOnly StartTime { get; private set; }
    public TimeOnly EndTime { get; private set; }
    public string? Room { get; private set; }
    public string TermName { get; private set; } = string.Empty;

    public Section Section { get; private set; } = null!;
    public Subject Subject { get; private set; } = null!;
    public Staff Teacher { get; private set; } = null!;

    private TimetableSlot() { }

    public static TimetableSlot Create(Guid sectionId, Guid subjectId, Guid teacherId,
        DayOfWeek day, TimeOnly start, TimeOnly end, string termName, string? room = null)
    {
        if (end <= start) throw new ArgumentException("End time must be after start time.");
        return new TimetableSlot
        {
            SectionId = sectionId,
            SubjectId = subjectId,
            TeacherId = teacherId,
            DayOfWeek = day,
            StartTime = start,
            EndTime = end,
            TermName = termName,
            Room = room
        };
    }
}
