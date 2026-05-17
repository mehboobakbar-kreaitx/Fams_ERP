using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.Academic.Attendance.Queries.GetSectionAttendance;

public class GetSectionAttendanceQueryHandler
    : IRequestHandler<GetSectionAttendanceQuery, Result<IReadOnlyList<SectionAttendanceEntryDto>>>
{
    private readonly IFamsDbContext _db;
    public GetSectionAttendanceQueryHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<IReadOnlyList<SectionAttendanceEntryDto>>> Handle(
        GetSectionAttendanceQuery request, CancellationToken cancellationToken)
    {
        var date = request.Date.Date;

        var studentIds = await _db.Students.AsNoTracking()
            .Where(s => s.SectionId == request.SectionId)
            .Select(s => s.Id)
            .ToListAsync(cancellationToken);

        if (studentIds.Count == 0)
            return Result<IReadOnlyList<SectionAttendanceEntryDto>>.Success(
                Array.Empty<SectionAttendanceEntryDto>());

        var records = await _db.Attendances.AsNoTracking()
            .Where(a => a.StudentId != null
                && studentIds.Contains(a.StudentId.Value)
                && a.Date == date)
            .Select(a => new SectionAttendanceEntryDto(
                a.StudentId!.Value,
                a.IsPresent,
                a.IsLate,
                !a.IsPresent && !a.IsLate && a.Remarks == "On approved leave",
                a.Remarks))
            .ToListAsync(cancellationToken);

        return Result<IReadOnlyList<SectionAttendanceEntryDto>>.Success(records);
    }
}
