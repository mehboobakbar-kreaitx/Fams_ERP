namespace FAMS.Application.Modules.Academic.Timetable.Queries.GetTimetable;

public record TimetableSlotDto(
    Guid Id,
    Guid SectionId,
    string SectionName,
    Guid SubjectId,
    string SubjectName,
    string SubjectCode,
    Guid TeacherId,
    string TeacherName,
    DayOfWeek DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime,
    string? Room,
    string TermName);
