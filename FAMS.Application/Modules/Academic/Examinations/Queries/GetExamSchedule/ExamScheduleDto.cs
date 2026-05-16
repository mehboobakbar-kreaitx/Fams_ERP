namespace FAMS.Application.Modules.Academic.Examinations.Queries.GetExamSchedule;

public record ExamScheduleItemDto(
    Guid Id,
    Guid SubjectId,
    string SubjectName,
    string SubjectCode,
    DateTime ExamDate,
    TimeOnly StartTime,
    TimeOnly EndTime,
    decimal TotalMarks,
    string? Hall);

public record ExamScheduleDto(
    Guid Id,
    string Name,
    string ExamType,
    string TermName,
    Guid ClassId,
    DateTime StartDate,
    DateTime EndDate,
    bool IsPublished,
    IReadOnlyList<ExamScheduleItemDto> Items);
