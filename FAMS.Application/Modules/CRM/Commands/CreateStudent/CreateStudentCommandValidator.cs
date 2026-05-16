using FluentValidation;

namespace FAMS.Application.Modules.CRM.Commands.CreateStudent;

public class CreateStudentCommandValidator : AbstractValidator<CreateStudentCommand>
{
    public CreateStudentCommandValidator()
    {
        RuleFor(x => x.CampusId).NotEmpty();
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.FatherName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.DateOfBirth).LessThan(DateTime.UtcNow).WithMessage("Date of birth must be in the past.");
        RuleFor(x => x.Phone)
            .NotEmpty()
            .Matches(@"^03\d{2}-?\d{7}$")
            .WithMessage("Phone must be a valid Pakistani mobile number (03XX-XXXXXXX).");
        RuleFor(x => x.Email).EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email));
        RuleFor(x => x.ProgramId).NotEmpty();
        RuleFor(x => x.ClassId).NotEmpty();
        RuleFor(x => x.SectionId).NotEmpty();
        RuleFor(x => x.RollNumber).NotEmpty().MaximumLength(50);
        RuleFor(x => x.EmergencyContactName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.EmergencyContactPhone).NotEmpty().Matches(@"^03\d{2}-?\d{7}$");
    }
}
