using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.SuperAdmin.Schools.Commands.CreateSchool;

public record CreateSchoolCommand(
    string Name,
    string Code,
    string City,
    string? Address,
    string? Phone,
    string? Email,
    string? Website,
    string? LogoUrl) : IRequest<Result<CreateSchoolResult>>;
