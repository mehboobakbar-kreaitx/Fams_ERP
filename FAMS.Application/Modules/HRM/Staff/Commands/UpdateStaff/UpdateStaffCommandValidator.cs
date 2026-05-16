using FluentValidation;

namespace FAMS.Application.Modules.HRM.Staff.Commands.UpdateStaff;

public class UpdateStaffCommandValidator : AbstractValidator<UpdateStaffCommand>
{
    public UpdateStaffCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Designation).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Department).NotEmpty().MaximumLength(100);
        RuleFor(x => x.BasicSalary).GreaterThan(0);
    }
}
