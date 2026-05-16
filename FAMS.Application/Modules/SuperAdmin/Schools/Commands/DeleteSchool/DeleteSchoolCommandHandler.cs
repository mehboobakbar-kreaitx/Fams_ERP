using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.SuperAdmin.Schools.Commands.DeleteSchool;

public class DeleteSchoolCommandHandler : IRequestHandler<DeleteSchoolCommand, Result>
{
    private readonly IFamsDbContext _db;

    public DeleteSchoolCommandHandler(IFamsDbContext db) => _db = db;

    public async Task<Result> Handle(DeleteSchoolCommand request, CancellationToken cancellationToken)
    {
        var school = await _db.Schools.FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);
        if (school is null) return Result.Failure($"School {request.Id} not found.");

        var hasCampuses = await _db.Campuses.AnyAsync(c => c.SchoolId == request.Id, cancellationToken);
        if (hasCampuses)
            return Result.Failure("Cannot delete a school that has campuses. Remove or reassign campuses first.");

        school.IsDeleted = true;
        await _db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
