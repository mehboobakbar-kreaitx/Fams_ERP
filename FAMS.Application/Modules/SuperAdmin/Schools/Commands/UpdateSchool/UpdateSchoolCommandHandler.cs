using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.SuperAdmin.Schools.Commands.UpdateSchool;

public class UpdateSchoolCommandHandler : IRequestHandler<UpdateSchoolCommand, Result>
{
    private readonly IFamsDbContext _db;

    public UpdateSchoolCommandHandler(IFamsDbContext db) => _db = db;

    public async Task<Result> Handle(UpdateSchoolCommand request, CancellationToken cancellationToken)
    {
        var school = await _db.Schools.FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);
        if (school is null) return Result.Failure($"School {request.Id} not found.");

        school.Update(
            request.Name.Trim(),
            request.City.Trim(),
            request.Address?.Trim(),
            request.Phone?.Trim(),
            request.Email?.Trim(),
            request.Website?.Trim(),
            request.LogoUrl?.Trim());

        await _db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
