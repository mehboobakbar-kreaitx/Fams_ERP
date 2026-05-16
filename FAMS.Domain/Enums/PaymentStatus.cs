namespace FAMS.Domain.Enums;

public enum PaymentStatus
{
    Pending = 1,
    Paid = 2,
    PartiallyPaid = 3,
    Overdue = 4,
    Waived = 5,
    Refunded = 6
}
