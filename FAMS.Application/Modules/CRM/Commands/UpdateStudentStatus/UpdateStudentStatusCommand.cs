using FAMS.Application.Common.Models;
using FAMS.Domain.Enums;
using MediatR;

namespace FAMS.Application.Modules.CRM.Commands.UpdateStudentStatus;

public record UpdateStudentStatusCommand(Guid StudentId, StudentStatus NewStatus, string Reason) : IRequest<Result>;
