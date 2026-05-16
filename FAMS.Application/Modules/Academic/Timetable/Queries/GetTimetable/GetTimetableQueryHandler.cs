using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.Academic.Timetable.Queries.GetTimetable;

public class GetTimetableQueryHandler
    : IRequestHandler<GetTimetableQuery, Result<IReadOnlyList<TimetableSlotDto>>>
{
    private readonly IFamsDbContext _db;

    public GetTimetableQueryHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<IReadOnlyList<TimetableSlotDto>>> Handle(
        GetTimetableQuery request, CancellationToken cancellationToken)
    {
        if (request.SectionId is null && request.TeacherId is null)
            return Result<IReadOnlyList<TimetableSlotDto>>.Failure("Specify either SectionId or TeacherId.");

        var query = _db.TimetableSlots.AsNoTracking()
            .Where(t => t.TermName == request.TermName);

        if (request.SectionId.HasValue)
            query = query.Where(t => t.SectionId == request.SectionId.Value);
        if (request.TeacherId.HasValue)
            query = query.Where(t => t.TeacherId == request.TeacherId.Value);

        var rows = await query
            .Join(_db.Sections, t => t.SectionId, s => s.Id, (t, s) => new { t, SectionName = s.Name })
            .Join(_db.Subjects, x => x.t.SubjectId, sub => sub.Id,
                (x, sub) => new { x.t, x.SectionName, SubjectName = sub.Name, SubjectCode = sub.Code })
            .Join(_db.StaffMembers, x => x.t.TeacherId, st => st.Id,
                (x, st) => new TimetableSlotDto(
                    x.t.Id, x.t.SectionId, x.SectionName,
                    x.t.SubjectId, x.SubjectName, x.SubjectCode,
                    x.t.TeacherId, st.FirstName + " " + st.LastName,
                    x.t.DayOfWeek, x.t.StartTime, x.t.EndTime, x.t.Room, x.t.TermName))
            .OrderBy(d => d.DayOfWeek).ThenBy(d => d.StartTime)
            .ToListAsync(cancellationToken);

        return Result<IReadOnlyList<TimetableSlotDto>>.Success(rows);
    }
}
