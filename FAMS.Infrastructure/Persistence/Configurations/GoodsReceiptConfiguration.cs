using FAMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FAMS.Infrastructure.Persistence.Configurations;

public class GoodsReceiptConfiguration : IEntityTypeConfiguration<GoodsReceipt>
{
    public void Configure(EntityTypeBuilder<GoodsReceipt> b)
    {
        b.ToTable("goods_receipts");
        b.HasKey(g => g.Id);
        b.Property(g => g.ReceiptNumber).HasMaxLength(50).IsRequired();
        b.Property(g => g.DeliveryNoteRef).HasMaxLength(100);
        b.Property(g => g.Notes).HasMaxLength(1000);
        b.HasIndex(g => g.ReceiptNumber).IsUnique();
        b.HasIndex(g => g.PurchaseOrderId);
        b.HasOne(g => g.PurchaseOrder)
            .WithMany()
            .HasForeignKey(g => g.PurchaseOrderId)
            .OnDelete(DeleteBehavior.Restrict);
        b.HasMany(g => g.LineItems)
            .WithOne(li => li.GoodsReceipt)
            .HasForeignKey(li => li.GoodsReceiptId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class GoodsReceiptLineItemConfiguration : IEntityTypeConfiguration<GoodsReceiptLineItem>
{
    public void Configure(EntityTypeBuilder<GoodsReceiptLineItem> b)
    {
        b.ToTable("goods_receipt_line_items");
        b.HasKey(l => l.Id);
        b.Property(l => l.QuantityReceived).HasPrecision(14, 2);
        b.Property(l => l.QuantityRejected).HasPrecision(14, 2);
        b.Property(l => l.Condition).HasMaxLength(200);
        b.HasOne(l => l.POLineItem)
            .WithMany()
            .HasForeignKey(l => l.POLineItemId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
