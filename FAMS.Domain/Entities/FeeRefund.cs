using FAMS.Domain.Common;

namespace FAMS.Domain.Entities;

public enum RefundStatus { Requested = 1, Approved = 2, Processed = 3, Rejected = 4 }

public class FeeRefund : BaseAuditableEntity
{
    public Guid PaymentId { get; private set; }
    public decimal Amount { get; private set; }
    public string Reason { get; private set; } = string.Empty;
    public RefundStatus Status { get; private set; } = RefundStatus.Requested;
    public Guid RequestedById { get; private set; }
    public Guid? ApprovedById { get; private set; }
    public DateTime? ProcessedAt { get; private set; }
    public string? BankTransferRef { get; private set; }

    public FeePayment Payment { get; private set; } = null!;

    private FeeRefund() { }

    public static FeeRefund Request(Guid paymentId, decimal amount, string reason, Guid requestedById)
        => new()
        {
            PaymentId = paymentId,
            Amount = amount,
            Reason = reason,
            RequestedById = requestedById,
            Status = RefundStatus.Requested,
        };

    public void Approve(Guid approvedById) { Status = RefundStatus.Approved; ApprovedById = approvedById; }
    public void MarkProcessed(string bankRef) { Status = RefundStatus.Processed; ProcessedAt = DateTime.UtcNow; BankTransferRef = bankRef; }
    public void Reject() => Status = RefundStatus.Rejected;
}
