using FluentValidation;

namespace FAMS.Application.Modules.Finance.Fee.Commands.RecordPayment;

public class RecordPaymentCommandValidator : AbstractValidator<RecordPaymentCommand>
{
    private static readonly string[] AllowedMethods = ["Cash", "BankTransfer", "JazzCash", "Easypaisa", "Cheque"];

    public RecordPaymentCommandValidator()
    {
        RuleFor(x => x.InvoiceId).NotEmpty();
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.PaymentMethod)
            .NotEmpty()
            .Must(m => AllowedMethods.Contains(m))
            .WithMessage($"PaymentMethod must be one of: {string.Join(", ", AllowedMethods)}");
        RuleFor(x => x.ReceivedById).NotEmpty();
    }
}
