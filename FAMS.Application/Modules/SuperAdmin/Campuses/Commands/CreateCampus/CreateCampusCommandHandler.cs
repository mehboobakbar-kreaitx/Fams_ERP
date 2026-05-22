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
        // SystemAdmin passes SchoolId explicitly via the command.
        var schoolId = request.SchoolId ?? _currentUser.SchoolId ?? Guid.Empty;
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

        // Bind the caller to this campus on first-time setup — but only for school-scoped users
        // (e.g., a new Principal with no campus yet). SystemAdmin must keep CampusId = Guid.Empty
        // so RLS and token claims remain network-wide; assigning them to a campus would scope
        // their next JWT to a single campus and break cross-campus visibility.
        var callerIsSystemAdmin = _currentUser.Roles.Contains("SystemAdmin");
        if (_currentUser.UserId is not null && _currentUser.CampusId == Guid.Empty && !callerIsSystemAdmin)
            await _identity.UpdateCampusIdAsync(_currentUser.UserId, campus.Id);

        return Result<Guid>.Success(campus.Id);
    }
}
