using FluentValidation;

namespace FAMS.Application.Modules.Auth.Commands.ValidateMfaLogin;

public class ValidateMfaLoginCommandValidator : AbstractValidator<ValidateMfaLoginCommand>
{
    public ValidateMfaLoginCommandValidator()
    {
        RuleFor(x => x.MfaChallengeToken).NotEmpty();
        RuleFor(x => x.Code)
            .NotEmpty()
            .Matches(@"^[0-9\s-]{6,20}$")
            .WithMessage("MFA code must be a valid authenticator code.");
    }
}
