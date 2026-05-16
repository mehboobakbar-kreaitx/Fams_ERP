using FAMS.Application.Common.Models;
using FAMS.Domain.Enums;
using MediatR;

namespace FAMS.Application.Modules.HRM.Leaves.Commands.ApplyLeave;

public record ApplyLeaveCommand(
    Guid StaffId,
    LeaveType LeaveType,
    DateTime StartDate,
    DateTime EndDate,
    string Reason) : IRequest<Result<Guid>>;
