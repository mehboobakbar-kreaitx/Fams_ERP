using FAMS.Domain.Entities;
using FAMS.Domain.Enums;
using FluentAssertions;

namespace FAMS.UnitTests.Domain;

public class FeeInvoiceTests
{
    private static FeeInvoice CreateInvoice(decimal total = 1000m, decimal discount = 0m)
    {
        return FeeInvoice.Create(
            Guid.NewGuid(), "INV-001",
            DateTime.UtcNow, DateTime.UtcNow.AddDays(30),
            total, "Term-1", discount);
    }

    [Fact]
    public void Create_InitialisesCorrectly()
    {
        var invoice = CreateInvoice(total: 1500m, discount: 100m);

        invoice.TotalAmount.Should().Be(1500m);
        invoice.PaidAmount.Should().Be(0m);
        invoice.Discount.Should().Be(100m);
        invoice.LateFee.Should().Be(0m);
        invoice.Status.Should().Be(PaymentStatus.Pending);
        invoice.Balance.Should().Be(1400m);
    }

    [Fact]
    public void ApplyPayment_PartialPayment_SetsPartiallyPaid()
    {
        var invoice = CreateInvoice(total: 1000m);

        invoice.ApplyPayment(400m);

        invoice.PaidAmount.Should().Be(400m);
        invoice.Status.Should().Be(PaymentStatus.PartiallyPaid);
        invoice.Balance.Should().Be(600m);
    }

    [Fact]
    public void ApplyPayment_ExactAmount_SetsPaid()
    {
        var invoice = CreateInvoice(total: 1000m);

        invoice.ApplyPayment(1000m);

        invoice.Status.Should().Be(PaymentStatus.Paid);
        invoice.Balance.Should().Be(0m);
    }

    [Fact]
    public void ApplyPayment_Overpayment_SetsPaid()
    {
        var invoice = CreateInvoice(total: 1000m);

        invoice.ApplyPayment(1200m);

        invoice.Status.Should().Be(PaymentStatus.Paid);
        invoice.Balance.Should().Be(-200m);
    }

    [Fact]
    public void ApplyLateFee_AddsToLateFeeAndSetsOverdue()
    {
        var invoice = CreateInvoice(total: 1000m);

        invoice.ApplyLateFee(50m);

        invoice.LateFee.Should().Be(50m);
        invoice.Status.Should().Be(PaymentStatus.Overdue);
        invoice.Balance.Should().Be(1050m);
    }

    [Fact]
    public void ApplyPayment_WithDiscountAndLateFee_CorrectBalance()
    {
        var invoice = CreateInvoice(total: 1000m, discount: 100m);
        invoice.ApplyLateFee(50m);

        // total owed = 1000 + 50 - 100 = 950
        invoice.ApplyPayment(950m);

        invoice.Status.Should().Be(PaymentStatus.Paid);
        invoice.Balance.Should().Be(0m);
    }

    [Fact]
    public void Balance_ReflectsAccumulatedPayments()
    {
        var invoice = CreateInvoice(total: 1000m);
        invoice.ApplyPayment(300m);
        invoice.ApplyPayment(200m);

        invoice.Balance.Should().Be(500m);
        invoice.PaidAmount.Should().Be(500m);
    }
}
