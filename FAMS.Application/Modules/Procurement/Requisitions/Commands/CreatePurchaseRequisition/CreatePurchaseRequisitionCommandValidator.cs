using FluentValidation;

namespace FAMS.Application.Modules.Procurement.Requisitions.Commands.CreatePurchaseRequisition;

public class CreatePurchaseRequisitionCommandValidator : AbstractValidator<CreatePurchaseRequisitionCommand>
{
    public CreatePurchaseRequisitionCommandValidator()
    {
        RuleFor(x => x.RequestedById).NotEmpty();
        RuleFor(x => x.Department).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Justification).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.LineItems).NotEmpty().WithMessage("Requisition must have at least one line item.");
        RuleForEach(x => x.LineItems).ChildRules(li =>
        {
            li.RuleFor(l => l.Description).NotEmpty().MaximumLength(500);
            li.RuleFor(l => l.Quantity).GreaterThan(0);
            li.RuleFor(l => l.EstimatedUnitPrice).GreaterThanOrEqualTo(0);
            li.RuleFor(l => l.Unit).NotEmpty().MaximumLength(20);
        });
    }
}
