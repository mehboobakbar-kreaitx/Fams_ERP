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

        // When parent CNIC is supplied, the core parent fields become required.
        When(x => !string.IsNullOrWhiteSpace(x.ParentCnic), () =>
        {
            RuleFor(x => x.ParentFirstName).NotEmpty().MaximumLength(100);
            RuleFor(x => x.ParentLastName).NotEmpty().MaximumLength(100);
            RuleFor(x => x.ParentCnic).Matches(@"^\d{5}-\d{7}-\d$").WithMessage("ParentCnic must be in format 00000-0000000-0.");
            RuleFor(x => x.ParentPhone).NotEmpty().MaximumLength(20);
            RuleFor(x => x.ParentRelationship).NotEmpty().MaximumLength(50);
            RuleFor(x => x.ParentAddress).NotEmpty().MaximumLength(300);
            RuleFor(x => x.ParentEmail).EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.ParentEmail));
        });
    }
}
