using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Finance.Fee.Commands.ApplyLateFee;

public record ApplyLateFeeCommand(
    Guid CampusId,
    decimal LateFeeAmount,
    bool IsPercentage = false) : IRequest<Result<int>>;
