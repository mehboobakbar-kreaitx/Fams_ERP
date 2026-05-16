using System.Security.Cryptography;
using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using FAMS.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.SuperAdmin.Schools.Commands.CreateSchool;

public class CreateSchoolCommandHandler : IRequestHandler<CreateSchoolCommand, Result<CreateSchoolResult>>
{
    private readonly IFamsDbContext _db;
    private readonly IIdentityService _identity;

    public CreateSchoolCommandHandler(IFamsDbContext db, IIdentityService identity)
    {
        _db = db;
        _identity = identity;
    }

    public async Task<Result<CreateSchoolResult>> Handle(
        CreateSchoolCommand request, CancellationToken cancellationToken)
    {
        var normalizedCode = request.Code.Trim().ToUpperInvariant();

        if (await _db.Schools.AnyAsync(s => s.Code == normalizedCode, cancellationToken))
            return Result<CreateSchoolResult>.Failure($"A school with code '{normalizedCode}' already exists.");

        // Create school record
        var school = School.Create(
            request.Name.Trim(),
            normalizedCode,
            request.City.Trim(),
            request.Address?.Trim(),
            request.Phone?.Trim(),
            request.Email?.Trim(),
            request.Website?.Trim(),
            request.LogoUrl?.Trim());

        _db.Schools.Add(school);
        await _db.SaveChangesAsync(cancellationToken);

        // Generate school admin credentials
        var adminEmail    = $"admin@{normalizedCode.ToLowerInvariant()}.fams.io";
        var adminPassword = GeneratePassword();

        var (succeeded, _, error) = await _identity.CreateUserAsync(
            adminEmail, adminPassword,
            "School", "Admin",
            schoolId:  school.Id,
            campusId:  Guid.Empty,
            role:      "Principal");

        if (!succeeded)
            return Result<CreateSchoolResult>.Failure(
                $"School created but failed to create admin user: {error}");

        return Result<CreateSchoolResult>.Success(
            new CreateSchoolResult(school.Id, adminEmail, adminPassword));
    }

    // Generates a 12-character password guaranteed to satisfy ASP.NET Identity defaults:
    // at least one uppercase, lowercase, digit, and non-alphanumeric character.
    private static string GeneratePassword()
    {
        const string upper   = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        const string lower   = "abcdefghjkmnpqrstuvwxyz";
        const string digits  = "23456789";
        const string special = "!@#$&*";
        const string all     = upper + lower + digits + special;

        var bytes = RandomNumberGenerator.GetBytes(16);
        var chars = new char[12];

        // Guarantee one of each required class in the first four positions
        chars[0] = upper  [bytes[0]  % upper.Length];
        chars[1] = lower  [bytes[1]  % lower.Length];
        chars[2] = digits [bytes[2]  % digits.Length];
        chars[3] = special[bytes[3]  % special.Length];
        for (var i = 4; i < 12; i++)
            chars[i] = all[bytes[i] % all.Length];

        // Fisher-Yates shuffle so the required chars aren't always at the front
        var shuffle = RandomNumberGenerator.GetBytes(12);
        for (var i = 11; i > 0; i--)
        {
            var j = shuffle[i] % (i + 1);
            (chars[i], chars[j]) = (chars[j], chars[i]);
        }

        return new string(chars);
    }
}
