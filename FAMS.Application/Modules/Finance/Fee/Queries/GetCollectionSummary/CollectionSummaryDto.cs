namespace FAMS.Application.Modules.Finance.Fee.Queries.GetCollectionSummary;

public record CollectionSummaryDto(
    decimal TotalBilled,
    decimal TotalCollected,
    decimal TotalOutstanding,
    decimal LateFeeApplied,
    decimal DiscountApplied,
    decimal CollectionRate,
    int OverdueInvoiceCount);
