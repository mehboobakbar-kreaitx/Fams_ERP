using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using FAMS.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.SuperAdmin.Campuses.Commands.CreateCampus;

public class CreateCampusCommandHandler : IRequestHandler<CreateCampusCommand, Result<Guid>>
{
    private readonly IFamsDbContext _db;

    public CreateCampusCommandHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<Guid>> Handle(CreateCampusCommand request, CancellationToken cancellationToken)
    {
        var normalizedCode = request.Code.Trim().ToUpperInvariant();
        var exists = await _db.Campuses.AnyAsync(c => c.Code == normalizedCode, cancellationToken);
        if (exists) return Result<Guid>.Failure($"A campus with code '{normalizedCode}' already exists.");

        var campus = Campus.Create(
            request.Name.Trim(),
            normalizedCode,
            request.City.Trim(),
            request.Address.Trim(),
            request.Phone.Trim(),
            request.Email.Trim(),
            request.PrincipalName.Trim(),
            request.MaxCapacity,
            request.IsMainCampus);

        // Campus row itself doesn't belong to any campus — set self-id after creation.
        campus.CampusId = campus.Id;

        _db.Campuses.Add(campus);
        await _db.SaveChangesAsync(cancellationToken);
        return Result<Guid>.Success(campus.Id);
    }
}
