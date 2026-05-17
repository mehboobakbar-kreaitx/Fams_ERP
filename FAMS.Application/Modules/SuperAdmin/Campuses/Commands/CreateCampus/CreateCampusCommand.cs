using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.SuperAdmin.Campuses.Commands.CreateCampus;

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
