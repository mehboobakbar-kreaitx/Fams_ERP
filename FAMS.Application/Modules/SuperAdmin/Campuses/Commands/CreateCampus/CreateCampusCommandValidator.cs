using FluentValidation;

namespace FAMS.Application.Modules.SuperAdmin.Campuses.Commands.CreateCampus;

public class CreateCampusCommandValidator : AbstractValidator<CreateCampusCommand>
{
    public CreateCampusCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Code).NotEmpty().MaximumLength(20)
            .Matches("^[A-Za-z0-9-]+$").WithMessage("Code may only contain letters, digits and dashes.");
        RuleFor(x => x.City).NotEmpty().MaximumLength(80);
        RuleFor(x => x.Address).NotEmpty().MaximumLength(300);
        RuleFor(x => x.Phone).NotEmpty().MaximumLength(30);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(150);
        RuleFor(x => x.PrincipalName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.MaxCapacity).GreaterThan(0).LessThanOrEqualTo(50_000);
    }
}
