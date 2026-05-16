using FAMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FAMS.Infrastructure.Persistence.Configurations;

public class PurchaseRequisitionConfiguration : IEntityTypeConfiguration<PurchaseRequisition>
{
    public void Configure(EntityTypeBuilder<PurchaseRequisition> b)
    {
        b.ToTable("purchase_requisitions");
        b.HasKey(r => r.Id);
        b.Property(r => r.RequisitionNumber).HasMaxLength(50).IsRequired();
        b.Property(r => r.Department).HasMaxLength(100).IsRequired();
        b.Property(r => r.Justification).HasMaxLength(2000).IsRequired();
        b.Property(r => r.EstimatedTotal).HasPrecision(14, 2);
        b.Property(r => r.Status).HasConversion<int>();
        b.Property(r => r.ReviewNotes).HasMaxLength(500);
        b.HasIndex(r => r.RequisitionNumber).IsUnique();
        b.HasIndex(r => new { r.CampusId, r.Status });
        b.HasMany(r => r.LineItems)
            .WithOne(li => li.Requisition)
            .HasForeignKey(li => li.RequisitionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class RequisitionLineItemConfiguration : IEntityTypeConfiguration<RequisitionLineItem>
{
    public void Configure(EntityTypeBuilder<RequisitionLineItem> b)
    {
        b.ToTable("requisition_line_items");
        b.HasKey(l => l.Id);
        b.Property(l => l.Description).HasMaxLength(500).IsRequired();
        b.Property(l => l.Quantity).HasPrecision(14, 2);
        b.Property(l => l.EstimatedUnitPrice).HasPrecision(14, 2);
        b.Property(l => l.Unit).HasMaxLength(20).IsRequired();
    }
}
