using FAMS.Domain.Common;
using FAMS.Domain.Enums;

namespace FAMS.Domain.Entities;

public class FeeInvoice : BaseAuditableEntity
{
    public Guid StudentId { get; private set; }
    public string InvoiceNumber { get; private set; } = string.Empty;
    public DateTime IssueDate { get; private set; }
    public DateTime DueDate { get; private set; }
    public decimal TotalAmount { get; private set; }
    public decimal PaidAmount { get; private set; }
    public PaymentStatus Status { get; private set; } = PaymentStatus.Pending;
    public string TermName { get; private set; } = string.Empty;
    public decimal LateFee { get; private set; }
    public decimal Discount { get; private set; }

    public Student Student { get; private set; } = null!;
    public ICollection<FeePayment> Payments { get; private set; } = new List<FeePayment>();

    private FeeInvoice() { }

    public static FeeInvoice Create(Guid studentId, string invoiceNumber, DateTime issueDate,
        DateTime dueDate, decimal totalAmount, string termName, decimal discount = 0)
    {
        return new FeeInvoice
        {
            StudentId = studentId,
            InvoiceNumber = invoiceNumber,
            IssueDate = issueDate,
            DueDate = dueDate,
            TotalAmount = totalAmount,
            PaidAmount = 0,
            Status = PaymentStatus.Pending,
            TermName = termName,
            Discount = discount
        };
    }

    public void ApplyPayment(decimal amount)
    {
        PaidAmount += amount;
        Status = PaidAmount >= TotalAmount + LateFee - Discount
            ? PaymentStatus.Paid
            : PaymentStatus.PartiallyPaid;
    }

    public void ApplyLateFee(decimal amount)
    {
        LateFee += amount;
        Status = PaymentStatus.Overdue;
    }

    public decimal Balance => TotalAmount + LateFee - Discount - PaidAmount;
}
