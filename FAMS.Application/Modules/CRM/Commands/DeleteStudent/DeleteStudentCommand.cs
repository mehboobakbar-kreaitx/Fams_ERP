using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.CRM.Commands.DeleteStudent;

public record DeleteStudentCommand(Guid Id) : IRequest<Result>;
