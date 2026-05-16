using FluentValidation;

namespace FAMS.Application.Modules.HRM.Leaves.Commands.ApplyLeave;

public class ApplyLeaveCommandValidator : AbstractValidator<ApplyLeaveCommand>
{
    public ApplyLeaveCommandValidator()
    {
        RuleFor(x => x.StaffId).NotEmpty();
        RuleFor(x => x.StartDate).LessThanOrEqualTo(x => x.EndDate);
        RuleFor(x => x.Reason).NotEmpty().MaximumLength(500);
    }
}
