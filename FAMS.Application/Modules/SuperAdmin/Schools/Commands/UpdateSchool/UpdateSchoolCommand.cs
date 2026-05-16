using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.SuperAdmin.Schools.Commands.UpdateSchool;

public record UpdateSchoolCommand(
    Guid Id,
    string Name,
    string City,
    string? Address,
    string? Phone,
    string? Email,
    string? Website,
    string? LogoUrl) : IRequest<Result>;
