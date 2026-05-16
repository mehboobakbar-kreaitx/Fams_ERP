namespace FAMS.Application.Modules.Results.Queries.GetStudentResults;

public record StudentResultDto(
    Guid Id,
    Guid StudentId,
    Guid SubjectId,
    string SubjectName,
    string SubjectCode,
    string ExamType,
    string TermName,
    decimal MarksObtained,
    decimal TotalMarks,
    decimal Percentage,
    string? Grade,
    string? Remarks,
    bool IsPublished,
    DateTime? PublishedAt);
