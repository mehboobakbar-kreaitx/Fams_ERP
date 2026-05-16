using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Platform.Config.Commands.CreateAcademicTerm;

public record CreateAcademicTermCommand(
    string Name,
    DateTime StartDate,
    DateTime EndDate) : IRequest<Result<Guid>>;
