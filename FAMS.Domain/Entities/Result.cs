using FAMS.Domain.Common;

namespace FAMS.Domain.Entities;

public class Result : BaseAuditableEntity
{
    public Guid StudentId { get; private set; }
    public Guid SubjectId { get; private set; }
    public string ExamType { get; private set; } = string.Empty;
    public decimal MarksObtained { get; private set; }
    public decimal TotalMarks { get; private set; }
    public string? Grade { get; private set; }
    public string? Remarks { get; private set; }
    public string TermName { get; private set; } = string.Empty;
    public bool IsPublished { get; private set; }
    public DateTime? PublishedAt { get; private set; }

    public Student Student { get; private set; } = null!;
    public Subject Subject { get; private set; } = null!;

    private Result() { }

    public static Result Create(Guid studentId, Guid subjectId, string examType,
        decimal marksObtained, decimal totalMarks, string termName,
        string? grade = null, string? remarks = null)
    {
        return new Result
        {
            StudentId = studentId,
            SubjectId = subjectId,
            ExamType = examType,
            MarksObtained = marksObtained,
            TotalMarks = totalMarks,
            Grade = grade,
            Remarks = remarks,
            TermName = termName,
            IsPublished = false
        };
    }

    public void Publish()
    {
        IsPublished = true;
        PublishedAt = DateTime.UtcNow;
    }
}
