using FAMS.Domain.Enums;

namespace FAMS.Application.Modules.Finance.Fee.Queries.GetInvoices;

public record InvoiceDto(
    Guid Id,
    string InvoiceNumber,
    Guid StudentId,
    string StudentName,
    string TermName,
    decimal TotalAmount,
    decimal PaidAmount,
    decimal LateFee,
    decimal Discount,
    decimal Balance,
    PaymentStatus Status,
    DateTime IssueDate,
    DateTime DueDate);
