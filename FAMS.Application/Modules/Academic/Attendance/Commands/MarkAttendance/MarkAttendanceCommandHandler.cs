using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using FAMS.Application.Common.Notifications.Events;
using MediatR;
using Microsoft.EntityFrameworkCore;
using AttendanceEntity = FAMS.Domain.Entities.Attendance;

namespace FAMS.Application.Modules.Academic.Attendance.Commands.MarkAttendance;

public class MarkAttendanceCommandHandler : IRequestHandler<MarkAttendanceCommand, Result<int>>
{
    private readonly IFamsDbContext _db;
    private readonly IPublisher _publisher;

    public MarkAttendanceCommandHandler(IFamsDbContext db, IPublisher publisher)
    {
        _db = db;
        _publisher = publisher;
    }

    public async Task<Result<int>> Handle(MarkAttendanceCommand request, CancellationToken cancellationToken)
    {
        var date = request.Date.Date;
        var entryStudentIds = request.Entries.Select(e => e.StudentId).ToList();

        // ── Section membership validation ─────────────────────────────────────
        var sectionStudentIds = (await _db.Students
            .Where(s => s.SectionId == request.SectionId)
            .Select(s => s.Id)
            .ToListAsync(cancellationToken)).ToHashSet();

        var outsideSection = entryStudentIds.Where(id => !sectionStudentIds.Contains(id)).ToList();
        if (outsideSection.Count > 0)
            return Result<int>.Failure(
                $"{outsideSection.Count} student(s) in the request do not belong to section '{request.SectionId}'.");

        // ── Duplicate detection ───────────────────────────────────────────────
        var existingForDate = await _db.Attendances
            .Where(a => a.Date == date && a.StudentId != null
                && entryStudentIds.Contains(a.StudentId.Value))
            .Select(a => a.StudentId!.Value)
            .ToListAsync(cancellationToken);
        var existing = existingForDate.ToHashSet();

        var newRecords = request.Entries
            .Where(e => !existing.Contains(e.StudentId))
            .Select(e => AttendanceEntity.CreateForStudent(
                e.StudentId, date, e.IsPresent, e.IsLate, request.MarkedById,
                e.Remarks, request.IsOfflineEntry))
            .ToList();

        if (newRecords.Count == 0)
            return Result<int>.Success(0);

        _db.Attendances.AddRange(newRecords);

        try
        {
            await _db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (
            ex.InnerException?.Message.Contains("unique", StringComparison.OrdinalIgnoreCase) == true ||
            ex.InnerException?.Message.Contains("23505") == true)
        {
            // Concurrent duplicate insert blocked by the DB unique index — return clean failure.
            return Result<int>.Failure(
                "Attendance for one or more students on this date was already recorded by a concurrent request. Please refresh and try again.");
        }

        // ── Absence notifications ─────────────────────────────────────────────
        // Skip for offline/retroactive sync — parents should not receive stale alerts days later.
        if (!request.IsOfflineEntry)
        {
            var newAbsentStudentIds = newRecords
                .Where(r => !r.IsPresent)
                .Select(r => r.StudentId!.Value)
                .ToHashSet();
            var leaveStudentIds = request.Entries
                .Where(e => e.IsLeave)
                .Select(e => e.StudentId)
                .ToHashSet();
            var absentStudentIds = newAbsentStudentIds.Except(leaveStudentIds).ToList();

            if (absentStudentIds.Count > 0)
            {
                var absentStudents = await _db.Students
                    .Where(s => absentStudentIds.Contains(s.Id))
                    .Select(s => new
                    {
                        s.Id, s.FirstName, s.LastName, s.CampusId,
                        ParentPhone = s.Parent != null ? s.Parent.Phone : null,
                        ParentEmail = s.Parent != null ? s.Parent.Email : null,
                    })
                    .ToListAsync(cancellationToken);

                foreach (var p in absentStudents)
                {
                    await _publisher.Publish(new StudentMarkedAbsentEvent(
                        p.Id, p.FirstName, p.LastName, date, p.ParentPhone, p.ParentEmail, p.CampusId),
                        cancellationToken);
                }
            }
        }

        return Result<int>.Success(newRecords.Count);
    }
}
