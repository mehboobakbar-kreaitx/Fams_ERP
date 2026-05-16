using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TimetableSlotEntity = FAMS.Domain.Entities.TimetableSlot;

namespace FAMS.Application.Modules.Academic.Timetable.Commands.CreateTimetable;

public class CreateTimetableCommandHandler : IRequestHandler<CreateTimetableCommand, Result<int>>
{
    private readonly IFamsDbContext _db;

    public CreateTimetableCommandHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<int>> Handle(CreateTimetableCommand request, CancellationToken cancellationToken)
    {
        var sectionIds = request.Slots.Select(s => s.SectionId).Distinct().ToList();
        var teacherIds = request.Slots.Select(s => s.TeacherId).Distinct().ToList();

        // Internal conflict checks (within the incoming batch)
        var conflicts = new List<string>();
        foreach (var day in request.Slots.Select(s => s.DayOfWeek).Distinct())
        {
            var daySlots = request.Slots.Where(s => s.DayOfWeek == day).ToList();
            foreach (var sectionGroup in daySlots.GroupBy(s => s.SectionId))
            {
                var ordered = sectionGroup.OrderBy(s => s.StartTime).ToList();
                for (int i = 1; i < ordered.Count; i++)
                {
                    if (ordered[i].StartTime < ordered[i - 1].EndTime)
                        conflicts.Add($"Section {sectionGroup.Key} on {day}: {ordered[i - 1].StartTime}-{ordered[i - 1].EndTime} overlaps {ordered[i].StartTime}-{ordered[i].EndTime}.");
                }
            }
            foreach (var teacherGroup in daySlots.GroupBy(s => s.TeacherId))
            {
                var ordered = teacherGroup.OrderBy(s => s.StartTime).ToList();
                for (int i = 1; i < ordered.Count; i++)
                {
                    if (ordered[i].StartTime < ordered[i - 1].EndTime)
                        conflicts.Add($"Teacher {teacherGroup.Key} on {day}: double-booked at {ordered[i].StartTime}.");
                }
            }
        }

        if (conflicts.Count > 0)
            return Result<int>.Failure("Conflicts: " + string.Join(" | ", conflicts));

        // DB conflicts (against existing slots in same term)
        var affectedDays = request.Slots.Select(s => s.DayOfWeek).Distinct().ToList();
        var existing = await _db.TimetableSlots
            .Where(t => t.TermName == request.TermName
                     && (sectionIds.Contains(t.SectionId) || teacherIds.Contains(t.TeacherId))
                     && affectedDays.Contains(t.DayOfWeek))
            .ToListAsync(cancellationToken);

        if (request.ReplaceExisting && existing.Count > 0)
        {
            _db.TimetableSlots.RemoveRange(existing);
            existing = new();
        }

        foreach (var slot in request.Slots)
        {
            var overlap = existing.FirstOrDefault(e =>
                e.DayOfWeek == slot.DayOfWeek &&
                ((e.SectionId == slot.SectionId) || (e.TeacherId == slot.TeacherId)) &&
                e.StartTime < slot.EndTime && slot.StartTime < e.EndTime);
            if (overlap is not null)
                return Result<int>.Failure(
                    $"Conflict with existing slot on {slot.DayOfWeek} {overlap.StartTime}-{overlap.EndTime} " +
                    $"(section {overlap.SectionId}, teacher {overlap.TeacherId}). Use ReplaceExisting=true to override.");
        }

        foreach (var slot in request.Slots)
        {
            var entity = TimetableSlotEntity.Create(
                slot.SectionId, slot.SubjectId, slot.TeacherId,
                slot.DayOfWeek, slot.StartTime, slot.EndTime, request.TermName, slot.Room);
            _db.TimetableSlots.Add(entity);
        }

        await _db.SaveChangesAsync(cancellationToken);
        return Result<int>.Success(request.Slots.Count);
    }
}
