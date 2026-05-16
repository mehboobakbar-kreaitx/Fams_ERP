using FluentValidation;

namespace FAMS.Application.Modules.CRM.Commands.UpdateStudent;

public class UpdateStudentCommandValidator : AbstractValidator<UpdateStudentCommand>
{
    public UpdateStudentCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Phone).NotEmpty().Matches(@"^03\d{2}-?\d{7}$");
        RuleFor(x => x.Email).EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email));
        RuleFor(x => x.EmergencyContactName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.EmergencyContactPhone).NotEmpty().Matches(@"^03\d{2}-?\d{7}$");
    }
}
