using FluentValidation;

namespace FAMS.Application.Modules.HRM.Staff.Commands.CreateStaff;

public class CreateStaffCommandValidator : AbstractValidator<CreateStaffCommand>
{
    public CreateStaffCommandValidator()
    {
        RuleFor(x => x.CampusId).NotEmpty();
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.FatherName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.CNIC)
            .NotEmpty()
            .Matches(@"^\d{5}-?\d{7}-?\d$")
            .WithMessage("CNIC must match the Pakistani format XXXXX-XXXXXXX-X.");
        RuleFor(x => x.Phone)
            .NotEmpty()
            .Matches(@"^03\d{2}-?\d{7}$")
            .WithMessage("Phone must be a valid Pakistani mobile number (03XX-XXXXXXX).");
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(150);
        RuleFor(x => x.DateOfBirth).LessThan(DateTime.UtcNow.AddYears(-18))
            .WithMessage("Staff must be at least 18 years old.");
        RuleFor(x => x.JoiningDate).LessThanOrEqualTo(DateTime.UtcNow);
        RuleFor(x => x.Designation).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Department).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Qualification).NotEmpty().MaximumLength(200);
        RuleFor(x => x.BasicSalary).GreaterThan(0);
        RuleFor(x => x.EmploymentType).NotEmpty().Must(t => t is "FullTime" or "PartTime" or "Contract" or "Visiting")
            .WithMessage("EmploymentType must be FullTime, PartTime, Contract, or Visiting.");
    }
}
