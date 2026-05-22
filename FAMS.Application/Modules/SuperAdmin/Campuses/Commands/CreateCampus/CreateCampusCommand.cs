using FAMS.Application.Common.Models;
using FAMS.Application.Common.Security;
using MediatR;

namespace FAMS.Application.Modules.SuperAdmin.Campuses.Commands.CreateCampus;

[Authorize(Roles = "SystemAdmin")]
public record CreateCampusCommand(
    string Name,
    string Code,
    string City,
    string Address,
    string Phone,
    string Email,
    string PrincipalName,
    int MaxCapacity,
    bool IsMainCampus = false,
    Guid? SchoolId = null) : IRequest<Result<Guid>>;
