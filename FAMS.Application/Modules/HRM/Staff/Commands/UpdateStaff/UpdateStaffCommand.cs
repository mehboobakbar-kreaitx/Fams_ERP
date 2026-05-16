using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.HRM.Staff.Commands.UpdateStaff;

public record UpdateStaffCommand(
    Guid Id,
    string Designation,
    string Department,
    decimal BasicSalary,
    string? Photo = null) : IRequest<Result>;
