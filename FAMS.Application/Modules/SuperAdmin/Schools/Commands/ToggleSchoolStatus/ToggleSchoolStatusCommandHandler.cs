using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.SuperAdmin.Schools.Commands.ToggleSchoolStatus;

public class ToggleSchoolStatusCommandHandler : IRequestHandler<ToggleSchoolStatusCommand, Result>
{
    private readonly IFamsDbContext _db;

    public ToggleSchoolStatusCommandHandler(IFamsDbContext db) => _db = db;

    public async Task<Result> Handle(ToggleSchoolStatusCommand request, CancellationToken cancellationToken)
    {
        var school = await _db.Schools.FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);
        if (school is null) return Result.Failure($"School {request.Id} not found.");

        if (request.IsActive)
            school.Activate();
        else
            school.Deactivate();

        await _db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
