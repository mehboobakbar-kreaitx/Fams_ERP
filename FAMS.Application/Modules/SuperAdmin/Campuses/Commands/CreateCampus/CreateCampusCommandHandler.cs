using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using FAMS.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.SuperAdmin.Campuses.Commands.CreateCampus;

public class CreateCampusCommandHandler : IRequestHandler<CreateCampusCommand, Result<Guid>>
{
    private readonly IFamsDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IIdentityService _identity;

    public CreateCampusCommandHandler(
        IFamsDbContext db,
        ICurrentUserService currentUser,
        IIdentityService identity)
    {
        _db = db;
        _currentUser = currentUser;
        _identity = identity;
    }

    public async Task<Result<Guid>> Handle(CreateCampusCommand request, CancellationToken cancellationToken)
    {
        var normalizedCode = request.Code.Trim().ToUpperInvariant();
        if (await _db.Campuses.AnyAsync(c => c.Code == normalizedCode, cancellationToken))
            return Result<Guid>.Failure($"A campus with code '{normalizedCode}' already exists.");

        // Resolve which school this campus belongs to.
        // School-scoped users (Principal during setup) carry SchoolId in their JWT.
        // SystemAdmin passes SchoolId explicitly via the command (or it's inferred below).
        var schoolId = _currentUser.SchoolId ?? Guid.Empty;
        if (schoolId == Guid.Empty)
            return Result<Guid>.Failure("Cannot create a campus without an associated school.");

        if (!await _db.Schools.AnyAsync(s => s.Id == schoolId, cancellationToken))
            return Result<Guid>.Failure("Associated school not found.");

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

        campus.AssignSchool(schoolId);
        campus.CampusId = campus.Id; // BaseEntity.CampusId self-reference for audit

        _db.Campuses.Add(campus);
        await _db.SaveChangesAsync(cancellationToken);

        // If the caller has no campus yet (first setup), bind them to this new campus
        // so their next token refresh carries the correct CampusId.
        if (_currentUser.UserId is not null && _currentUser.CampusId == Guid.Empty)
            await _identity.UpdateCampusIdAsync(_currentUser.UserId, campus.Id);

        return Result<Guid>.Success(campus.Id);
    }
}
