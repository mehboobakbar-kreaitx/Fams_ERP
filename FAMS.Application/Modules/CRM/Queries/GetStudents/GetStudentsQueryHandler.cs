using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.CRM.Queries.GetStudents;

public class GetStudentsQueryHandler : IRequestHandler<GetStudentsQuery, Result<PaginatedList<StudentDto>>>
{
    private readonly IFamsDbContext _db;

    public GetStudentsQueryHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<PaginatedList<StudentDto>>> Handle(GetStudentsQuery request, CancellationToken cancellationToken)
    {
        var query = _db.Students
            .AsNoTracking()
            .Where(s => s.CampusId == request.CampusId);

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.Trim().ToLower();
            query = query.Where(s =>
                s.FirstName.ToLower().Contains(term) ||
                s.LastName.ToLower().Contains(term) ||
                s.RollNumber.ToLower().Contains(term));
        }

        if (request.ClassId.HasValue)
            query = query.Where(s => s.ClassId == request.ClassId.Value);

        if (request.Status.HasValue)
            query = query.Where(s => s.Status == request.Status.Value);

        var projected = from s in query
                        join prg in _db.Programs.AsNoTracking() on s.ProgramId equals prg.Id into prgJoin
                        from prg in prgJoin.DefaultIfEmpty()
                        join cls in _db.ClassRooms.AsNoTracking() on s.ClassId equals cls.Id into clsJoin
                        from cls in clsJoin.DefaultIfEmpty()
                        join sec in _db.Sections.AsNoTracking() on s.SectionId equals sec.Id into secJoin
                        from sec in secJoin.DefaultIfEmpty()
                        orderby s.LastName, s.FirstName
                        select new StudentDto(
                            s.Id, s.FirstName, s.LastName, s.FatherName, s.RollNumber, s.Status,
                            s.ProgramId, prg != null ? prg.Name : null,
                            s.ClassId, cls != null ? cls.Name : null,
                            s.SectionId, sec != null ? sec.Name : null,
                            s.Phone, s.Email, s.Photo, s.EnrollmentDate);

        var paged = await PaginatedList<StudentDto>.CreateAsync(projected, request.PageNumber, request.PageSize, cancellationToken);
        return Result<PaginatedList<StudentDto>>.Success(paged);
    }
}
