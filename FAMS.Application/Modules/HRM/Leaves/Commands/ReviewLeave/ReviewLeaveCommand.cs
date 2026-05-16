using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.HRM.Leaves.Commands.ReviewLeave;

public record ReviewLeaveCommand(Guid LeaveId, bool Approved, Guid ReviewedById, string? Remarks = null) : IRequest<Result>;
