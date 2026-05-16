using FluentValidation;

namespace FAMS.Application.Modules.Procurement.GoodsReceipts.Commands.RecordGoodsReceipt;

public class RecordGoodsReceiptCommandValidator : AbstractValidator<RecordGoodsReceiptCommand>
{
    public RecordGoodsReceiptCommandValidator()
    {
        RuleFor(x => x.PurchaseOrderId).NotEmpty();
        RuleFor(x => x.ReceivedById).NotEmpty();
        RuleFor(x => x.Lines).NotEmpty();
        RuleForEach(x => x.Lines).ChildRules(l =>
        {
            l.RuleFor(li => li.POLineItemId).NotEmpty();
            l.RuleFor(li => li.QuantityReceived).GreaterThanOrEqualTo(0);
            l.RuleFor(li => li.QuantityRejected).GreaterThanOrEqualTo(0);
            l.RuleFor(li => li).Must(li => li.QuantityReceived + li.QuantityRejected > 0)
                .WithMessage("At least one of QuantityReceived or QuantityRejected must be greater than zero.");
        });
    }
}
