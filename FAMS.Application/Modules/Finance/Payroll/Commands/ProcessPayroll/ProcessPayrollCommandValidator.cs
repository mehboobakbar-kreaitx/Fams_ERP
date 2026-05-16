using FluentValidation;

namespace FAMS.Application.Modules.Finance.Payroll.Commands.ProcessPayroll;

public class ProcessPayrollCommandValidator : AbstractValidator<ProcessPayrollCommand>
{
    public ProcessPayrollCommandValidator()
    {
        RuleFor(x => x.CampusId).NotEmpty();
        RuleFor(x => x.Year).InclusiveBetween(2020, 2100);
        RuleFor(x => x.Month).InclusiveBetween(1, 12);
    }
}
