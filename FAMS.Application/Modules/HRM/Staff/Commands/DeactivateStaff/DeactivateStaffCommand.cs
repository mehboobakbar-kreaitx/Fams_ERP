using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.HRM.Staff.Commands.DeactivateStaff;

public record DeactivateStaffCommand(Guid Id, string Reason) : IRequest<Result>;
