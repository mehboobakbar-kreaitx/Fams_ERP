using FAMS.Domain.Common;

namespace FAMS.Domain.Entities;

public class Attendance : BaseAuditableEntity
{
    public Guid? StudentId { get; private set; }
    public Guid? StaffId { get; private set; }
    public DateTime Date { get; private set; }
    public bool IsPresent { get; private set; }
    public bool IsLate { get; private set; }
    public string? Remarks { get; private set; }
    public Guid MarkedById { get; private set; }
    public DateTime? SyncedAt { get; private set; }
    public bool IsOfflineEntry { get; private set; }

    private Attendance() { }

    public static Attendance CreateForStudent(Guid studentId, DateTime date, bool isPresent,
        bool isLate, Guid markedById, string? remarks = null, bool isOfflineEntry = false)
    {
        return new Attendance
        {
            StudentId = studentId,
            Date = date.Date,
            IsPresent = isPresent,
            IsLate = isLate,
            Remarks = remarks,
            MarkedById = markedById,
            IsOfflineEntry = isOfflineEntry,
            SyncedAt = isOfflineEntry ? DateTime.UtcNow : null
        };
    }

    public static Attendance CreateForStaff(Guid staffId, DateTime date, bool isPresent,
        bool isLate, Guid markedById, string? remarks = null)
    {
        return new Attendance
        {
            StaffId = staffId,
            Date = date.Date,
            IsPresent = isPresent,
            IsLate = isLate,
            Remarks = remarks,
            MarkedById = markedById
        };
    }

    public void MarkSynced() => SyncedAt = DateTime.UtcNow;
}
