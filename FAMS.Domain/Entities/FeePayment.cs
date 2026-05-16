using FAMS.Domain.Common;

namespace FAMS.Domain.Entities;

public class FeePayment : BaseAuditableEntity
{
    public Guid InvoiceId { get; private set; }
    public decimal Amount { get; private set; }
    public DateTime PaymentDate { get; private set; }
    public string PaymentMethod { get; private set; } = string.Empty;
    public string? TransactionId { get; private set; }
    public string ReceiptNumber { get; private set; } = string.Empty;
    public Guid ReceivedById { get; private set; }

    public FeeInvoice Invoice { get; private set; } = null!;

    private FeePayment() { }

    public static FeePayment Create(Guid invoiceId, decimal amount, string paymentMethod,
        string receiptNumber, Guid receivedById, string? transactionId = null)
    {
        return new FeePayment
        {
            InvoiceId = invoiceId,
            Amount = amount,
            PaymentDate = DateTime.UtcNow,
            PaymentMethod = paymentMethod,
            TransactionId = transactionId,
            ReceiptNumber = receiptNumber,
            ReceivedById = receivedById
        };
    }
}
