using FAMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FAMS.Infrastructure.Persistence.Configurations;

public class FeeInvoiceConfiguration : IEntityTypeConfiguration<FeeInvoice>
{
    public void Configure(EntityTypeBuilder<FeeInvoice> b)
    {
        b.ToTable("fee_invoices");
        b.HasKey(i => i.Id);
        b.Property(i => i.InvoiceNumber).HasMaxLength(50).IsRequired();
        b.Property(i => i.TotalAmount).HasPrecision(14, 2);
        b.Property(i => i.PaidAmount).HasPrecision(14, 2);
        b.Property(i => i.LateFee).HasPrecision(14, 2);
        b.Property(i => i.Discount).HasPrecision(14, 2);
        b.Property(i => i.Status).HasConversion<int>();
        b.HasIndex(i => i.InvoiceNumber).IsUnique();
        b.HasIndex(i => new { i.StudentId, i.TermName });
        // Supports outstanding-fees queries in dashboards and collection summaries.
        b.HasIndex(i => new { i.CampusId, i.Status });
        b.HasOne(i => i.Student).WithMany(s => s.FeeInvoices).HasForeignKey(i => i.StudentId).OnDelete(DeleteBehavior.Restrict);
    }
}
