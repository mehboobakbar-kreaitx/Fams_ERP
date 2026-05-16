using FAMS.Domain.Common;

namespace FAMS.Domain.Entities;

public class PurchaseOrder : BaseAuditableEntity
{
    public string PONumber { get; private set; } = string.Empty;
    public Guid VendorId { get; private set; }
    public DateTime OrderDate { get; private set; }
    public DateTime? ExpectedDelivery { get; private set; }
    public decimal TotalAmount { get; private set; }
    public string Status { get; private set; } = "Draft";
    public Guid? ApprovedById { get; private set; }
    public string? Notes { get; private set; }

    public Vendor Vendor { get; private set; } = null!;
    public ICollection<POLineItem> LineItems { get; private set; } = new List<POLineItem>();

    private PurchaseOrder() { }

    public static PurchaseOrder Create(string poNumber, Guid vendorId, DateTime orderDate,
        decimal totalAmount, DateTime? expectedDelivery = null, string? notes = null)
    {
        return new PurchaseOrder
        {
            PONumber = poNumber,
            VendorId = vendorId,
            OrderDate = orderDate,
            ExpectedDelivery = expectedDelivery,
            TotalAmount = totalAmount,
            Notes = notes,
            Status = "Draft"
        };
    }

    public void Approve(Guid approvedById)
    {
        Status = "Approved";
        ApprovedById = approvedById;
    }

    public void MarkDelivered() => Status = "Delivered";
    public void Cancel() => Status = "Cancelled";
}
