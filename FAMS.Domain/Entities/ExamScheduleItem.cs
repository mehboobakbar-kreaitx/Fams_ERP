using FAMS.Domain.Common;

namespace FAMS.Domain.Entities;

public class ExamScheduleItem : BaseAuditableEntity
{
    public Guid ExamId { get; private set; }
    public Guid SubjectId { get; private set; }
    public DateTime ExamDate { get; private set; }
    public TimeOnly StartTime { get; private set; }
    public TimeOnly EndTime { get; private set; }
    public decimal TotalMarks { get; private set; }
    public string? Hall { get; private set; }

    public Exam Exam { get; private set; } = null!;
    public Subject Subject { get; private set; } = null!;

    private ExamScheduleItem() { }

    public static ExamScheduleItem Create(Guid examId, Guid subjectId, DateTime examDate,
        TimeOnly start, TimeOnly end, decimal totalMarks, string? hall = null)
    {
        if (end <= start) throw new ArgumentException("End time must be after start time.");
        if (totalMarks <= 0) throw new ArgumentException("Total marks must be greater than zero.");
        return new ExamScheduleItem
        {
            ExamId = examId,
            SubjectId = subjectId,
            ExamDate = examDate.Date,
            StartTime = start,
            EndTime = end,
            TotalMarks = totalMarks,
            Hall = hall
        };
    }
}
