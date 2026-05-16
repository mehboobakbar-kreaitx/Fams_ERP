using FAMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FAMS.Infrastructure.Persistence.Configurations;

public class AssetConfiguration : IEntityTypeConfiguration<Asset>
{
    public void Configure(EntityTypeBuilder<Asset> b)
    {
        b.ToTable("assets");
        b.HasKey(a => a.Id);
        b.Property(a => a.Name).HasMaxLength(120).IsRequired();
        b.Property(a => a.AssetCode).HasMaxLength(40).IsRequired();
        b.Property(a => a.Category).HasMaxLength(60).IsRequired();
        b.Property(a => a.Location).HasMaxLength(100);
        b.Property(a => a.SerialNumber).HasMaxLength(80);
        b.Property(a => a.PurchasePrice).HasPrecision(14, 2);
        b.Property(a => a.CurrentValue).HasPrecision(14, 2);
        b.Property(a => a.Status).HasConversion<int>();
        b.HasIndex(a => a.AssetCode).IsUnique();
    }
}

public class VendorConfiguration : IEntityTypeConfiguration<Vendor>
{
    public void Configure(EntityTypeBuilder<Vendor> b)
    {
        b.ToTable("vendors");
        b.HasKey(v => v.Id);
        b.Property(v => v.Name).HasMaxLength(150).IsRequired();
        b.Property(v => v.ContactPerson).HasMaxLength(120);
        b.Property(v => v.Phone).HasMaxLength(30);
        b.Property(v => v.Email).HasMaxLength(150);
        b.Property(v => v.NTN).HasMaxLength(30);
        b.Property(v => v.Category).HasMaxLength(60);
        b.Property(v => v.PaymentTerms).HasMaxLength(100);
        b.Property(v => v.Rating).HasPrecision(3, 2);
    }
}

public class PurchaseOrderConfiguration : IEntityTypeConfiguration<PurchaseOrder>
{
    public void Configure(EntityTypeBuilder<PurchaseOrder> b)
    {
        b.ToTable("purchase_orders");
        b.HasKey(p => p.Id);
        b.Property(p => p.PONumber).HasMaxLength(40).IsRequired();
        b.Property(p => p.Status).HasMaxLength(30);
        b.Property(p => p.TotalAmount).HasPrecision(14, 2);
        b.Property(p => p.Notes).HasMaxLength(1000);
        b.HasIndex(p => p.PONumber).IsUnique();
        b.HasOne(p => p.Vendor).WithMany().HasForeignKey(p => p.VendorId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class POLineItemConfiguration : IEntityTypeConfiguration<POLineItem>
{
    public void Configure(EntityTypeBuilder<POLineItem> b)
    {
        b.ToTable("po_line_items");
        b.HasKey(li => li.Id);
        b.Property(li => li.Description).HasMaxLength(500).IsRequired();
        b.Property(li => li.Unit).HasMaxLength(20);
        b.Property(li => li.Quantity).HasPrecision(14, 3);
        b.Property(li => li.UnitPrice).HasPrecision(14, 2);
        b.Property(li => li.TotalPrice).HasPrecision(14, 2);
        b.HasOne(li => li.PurchaseOrder).WithMany(po => po.LineItems).HasForeignKey(li => li.POId).OnDelete(DeleteBehavior.Cascade);
    }
}
