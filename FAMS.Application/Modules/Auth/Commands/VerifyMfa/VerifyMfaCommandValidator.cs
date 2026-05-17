using FluentValidation;

namespace FAMS.Application.Modules.Auth.Commands.VerifyMfa;

public class VerifyMfaCommandValidator : AbstractValidator<VerifyMfaCommand>
{
    public VerifyMfaCommandValidator()
    {
        RuleFor(x => x)
            .Must(x => !string.IsNullOrWhiteSpace(x.UserId) || !string.IsNullOrWhiteSpace(x.MfaChallengeToken))
            .WithMessage("An authenticated user or MFA challenge token is required.");

        RuleFor(x => x.Code)
            .NotEmpty()
            .Matches(@"^[0-9\s-]{6,20}$")
            .WithMessage("MFA code must be a valid authenticator code.");
    }
}
