using FluentValidation;

namespace FAMS.Application.Modules.Admissions.Commands.EnrollApplicant;

public class EnrollApplicantCommandValidator : AbstractValidator<EnrollApplicantCommand>
{
    public EnrollApplicantCommandValidator()
    {
        RuleFor(x => x.ApplicationId).NotEmpty();
        RuleFor(x => x.ClassId).NotEmpty();
        RuleFor(x => x.SectionId).NotEmpty();
        RuleFor(x => x.RollNumber).NotEmpty().MaximumLength(30);
        RuleFor(x => x.EmergencyContactName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.EmergencyContactPhone).NotEmpty().MaximumLength(20);
    }
}
