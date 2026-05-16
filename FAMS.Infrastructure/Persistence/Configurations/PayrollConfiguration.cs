using FAMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FAMS.Infrastructure.Persistence.Configurations;

public class PayrollConfiguration : IEntityTypeConfiguration<Payroll>
{
    public void Configure(EntityTypeBuilder<Payroll> b)
    {
        b.ToTable("payrolls");
        b.HasKey(p => p.Id);
        b.Property(p => p.BasicSalary).HasPrecision(14, 2);
        b.Property(p => p.Allowances).HasPrecision(14, 2);
        b.Property(p => p.Deductions).HasPrecision(14, 2);
        b.Property(p => p.EobiContribution).HasPrecision(14, 2);
        b.Property(p => p.IncomeTax).HasPrecision(14, 2);
        b.Property(p => p.GrossSalary).HasPrecision(14, 2);
        b.Property(p => p.NetSalary).HasPrecision(14, 2);
        b.Property(p => p.Status).HasConversion<int>();
        b.Property(p => p.Remarks).HasMaxLength(500);
        b.HasIndex(p => new { p.StaffId, p.Year, p.Month }).IsUnique();
        b.HasOne(p => p.Staff)
            .WithMany()
            .HasForeignKey(p => p.StaffId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
