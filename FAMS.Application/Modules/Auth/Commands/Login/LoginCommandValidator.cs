using FluentValidation;

namespace FAMS.Application.Modules.Auth.Commands.Login;

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
        RuleFor(x => x.TotpCode)
            .Matches(@"^[0-9\s-]{6,20}$")
            .When(x => !string.IsNullOrWhiteSpace(x.TotpCode))
            .WithMessage("MFA code must be a valid authenticator code.");
    }
}
