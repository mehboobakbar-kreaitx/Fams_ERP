using FluentValidation;

namespace FAMS.Application.Modules.Auth.Commands.SetupMfa;

public class SetupMfaCommandValidator : AbstractValidator<SetupMfaCommand>
{
    public SetupMfaCommandValidator()
    {
        RuleFor(x => x)
            .Must(x => !string.IsNullOrWhiteSpace(x.UserId) || !string.IsNullOrWhiteSpace(x.MfaChallengeToken))
            .WithMessage("An authenticated user or MFA challenge token is required.");
    }
}
