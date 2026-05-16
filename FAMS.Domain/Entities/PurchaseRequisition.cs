using FAMS.Domain.Common;
using FAMS.Domain.Enums;

namespace FAMS.Domain.Entities;

public class PurchaseRequisition : BaseAuditableEntity
{
    public string RequisitionNumber { get; private set; } = string.Empty;
    public Guid RequestedById { get; private set; }
    public string Department { get; private set; } = string.Empty;
    public string Justification { get; private set; } = string.Empty;
    public DateTime? NeededBy { get; private set; }
    public decimal EstimatedTotal { get; private set; }
    public RequisitionStatus Status { get; private set; } = RequisitionStatus.Pending;
    public Guid? ReviewedById { get; private set; }
    public DateTime? ReviewedAt { get; private set; }
    public string? ReviewNotes { get; private set; }
    public Guid? LinkedPurchaseOrderId { get; private set; }

    public ICollection<RequisitionLineItem> LineItems { get; private set; } = new List<RequisitionLineItem>();

    private PurchaseRequisition() { }

    public static PurchaseRequisition Create(string requisitionNumber, Guid requestedById,
        string department, string justification, decimal estimatedTotal, DateTime? neededBy = null)
    {
        return new PurchaseRequisition
        {
            RequisitionNumber = requisitionNumber,
            RequestedById = requestedById,
            Department = department,
            Justification = justification,
            EstimatedTotal = estimatedTotal,
            NeededBy = neededBy,
            Status = RequisitionStatus.Pending
        };
    }

    public void Approve(Guid reviewedById, string? notes = null)
    {
        if (Status != RequisitionStatus.Pending)
            throw new InvalidOperationException($"Cannot approve requisition in status {Status}.");
        Status = RequisitionStatus.Approved;
        ReviewedById = reviewedById;
        ReviewedAt = DateTime.UtcNow;
        ReviewNotes = notes;
    }

    public void Reject(Guid reviewedById, string notes)
    {
        if (Status != RequisitionStatus.Pending)
            throw new InvalidOperationException($"Cannot reject requisition in status {Status}.");
        Status = RequisitionStatus.Rejected;
        ReviewedById = reviewedById;
        ReviewedAt = DateTime.UtcNow;
        ReviewNotes = notes;
    }

    public void AttachPurchaseOrder(Guid purchaseOrderId)
    {
        if (Status != RequisitionStatus.Approved)
            throw new InvalidOperationException("Requisition must be approved before issuing a PO.");
        Status = RequisitionStatus.POIssued;
        LinkedPurchaseOrderId = purchaseOrderId;
    }
}

public class RequisitionLineItem : BaseAuditableEntity
{
    public Guid RequisitionId { get; private set; }
    public string Description { get; private set; } = string.Empty;
    public decimal Quantity { get; private set; }
    public decimal EstimatedUnitPrice { get; private set; }
    public string Unit { get; private set; } = "pcs";

    public PurchaseRequisition Requisition { get; private set; } = null!;

    private RequisitionLineItem() { }

    public static RequisitionLineItem Create(Guid requisitionId, string description,
        decimal quantity, decimal estimatedUnitPrice, string unit = "pcs")
    {
        return new RequisitionLineItem
        {
            RequisitionId = requisitionId,
            Description = description,
            Quantity = quantity,
            EstimatedUnitPrice = estimatedUnitPrice,
            Unit = unit
        };
    }
}
