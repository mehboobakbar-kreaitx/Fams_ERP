using FAMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FAMS.Infrastructure.Persistence.Configurations;

public class AttendanceConfiguration : IEntityTypeConfiguration<Attendance>
{
    public void Configure(EntityTypeBuilder<Attendance> b)
    {
        b.ToTable("attendances");
        b.HasKey(a => a.Id);
        b.Property(a => a.Remarks).HasMaxLength(500);
        b.HasIndex(a => new { a.StudentId, a.Date })
            .IsUnique()
            .HasFilter("\"StudentId\" IS NOT NULL");
        b.HasIndex(a => new { a.StaffId, a.Date })
            .IsUnique()
            .HasFilter("\"StaffId\" IS NOT NULL");
    }
}

public class FeePaymentConfiguration : IEntityTypeConfiguration<FeePayment>
{
    public void Configure(EntityTypeBuilder<FeePayment> b)
    {
        b.ToTable("fee_payments");
        b.HasKey(p => p.Id);
        b.Property(p => p.Amount).HasPrecision(14, 2);
        b.Property(p => p.PaymentMethod).HasMaxLength(30);
        b.Property(p => p.TransactionId).HasMaxLength(100);
        b.Property(p => p.ReceiptNumber).HasMaxLength(50).IsRequired();
        b.HasIndex(p => p.ReceiptNumber).IsUnique();
        b.HasOne(p => p.Invoice).WithMany(i => i.Payments).HasForeignKey(p => p.InvoiceId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class ResultConfiguration : IEntityTypeConfiguration<Result>
{
    public void Configure(EntityTypeBuilder<Result> b)
    {
        b.ToTable("results");
        b.HasKey(r => r.Id);
        b.Property(r => r.MarksObtained).HasPrecision(8, 2);
        b.Property(r => r.TotalMarks).HasPrecision(8, 2);
        b.Property(r => r.ExamType).HasMaxLength(50);
        b.Property(r => r.Grade).HasMaxLength(10);
        b.HasIndex(r => new { r.StudentId, r.SubjectId, r.TermName, r.ExamType }).IsUnique();
        b.HasOne(r => r.Student).WithMany(s => s.Results).HasForeignKey(r => r.StudentId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(r => r.Subject).WithMany().HasForeignKey(r => r.SubjectId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class LeaveConfiguration : IEntityTypeConfiguration<Leave>
{
    public void Configure(EntityTypeBuilder<Leave> b)
    {
        b.ToTable("leaves");
        b.HasKey(l => l.Id);
        b.Property(l => l.LeaveType).HasConversion<int>();
        b.Property(l => l.Reason).HasMaxLength(500);
        b.Property(l => l.Status).HasMaxLength(20);
        b.HasOne(l => l.Staff).WithMany(s => s.Leaves).HasForeignKey(l => l.StaffId).OnDelete(DeleteBehavior.Restrict);
    }
}
