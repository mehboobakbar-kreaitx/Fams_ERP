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
        var existingForDate = await _db.Attendances
            .Where(a => a.Date == date && a.StudentId != null
                && request.Entries.Select(e => e.StudentId).Contains(a.StudentId.Value))
            .Select(a => a.StudentId!.Value)
            .ToListAsync(cancellationToken);
        var existing = existingForDate.ToHashSet();

        var newRecords = request.Entries
            .Where(e => !existing.Contains(e.StudentId))
            .Select(e => AttendanceEntity.CreateForStudent(
                e.StudentId, date, e.IsPresent, e.IsLate, request.MarkedById,
                e.Remarks, request.IsOfflineEntry))
            .ToList();

        _db.Attendances.AddRange(newRecords);
        await _db.SaveChangesAsync(cancellationToken);

        // Only notify for students who were freshly inserted as absent (not Leave, not already recorded).
        var newAbsentStudentIds = newRecords
            .Where(r => !r.IsPresent)
            .Select(r => r.StudentId!.Value)
            .ToHashSet();
        // Exclude entries the caller flagged as approved leave — those are not true absences.
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

        return Result<int>.Success(newRecords.Count);
    }
}
