using FluentValidation;

namespace FAMS.Application.Modules.Admissions.Commands.SubmitApplication;

public class SubmitApplicationCommandValidator : AbstractValidator<SubmitApplicationCommand>
{
    public SubmitApplicationCommandValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.FatherName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.DateOfBirth).LessThan(DateTime.UtcNow);
        RuleFor(x => x.Phone).NotEmpty().Matches(@"^03\d{2}-?\d{7}$");
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Address).NotEmpty();
        RuleFor(x => x.ProgramId).NotEmpty();
        RuleFor(x => x.CampusId).NotEmpty();
    }
}
