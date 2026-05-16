using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Platform.Config.Commands.CreateFeeStructure;

public record CreateFeeStructureCommand(
    Guid ProgramId,
    string TermName,
    string FeeHeadName,
    decimal Amount,
    int DueDayOfMonth = 10) : IRequest<Result<Guid>>;
