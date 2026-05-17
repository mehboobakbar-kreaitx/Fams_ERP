using FAMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FAMS.Infrastructure.Persistence.Configurations;

public class StudentConfiguration : IEntityTypeConfiguration<Student>
{
    public void Configure(EntityTypeBuilder<Student> b)
    {
        b.ToTable("students");
        b.HasKey(s => s.Id);
        b.Property(s => s.FirstName).HasMaxLength(100).IsRequired();
        b.Property(s => s.LastName).HasMaxLength(100).IsRequired();
        b.Property(s => s.FatherName).HasMaxLength(100).IsRequired();
        b.Property(s => s.Phone).HasMaxLength(20).IsRequired();
        b.Property(s => s.Email).HasMaxLength(150);
        b.Property(s => s.NIC).HasMaxLength(20);
        b.Property(s => s.BForm).HasMaxLength(20);
        b.Property(s => s.RollNumber).HasMaxLength(50).IsRequired();
        b.Property(s => s.Status).HasConversion<int>();
        b.Property(s => s.Gender).HasConversion<int>();

        b.HasIndex(s => new { s.CampusId, s.RollNumber }).IsUnique();
        b.HasIndex(s => s.Status);
        b.HasIndex(s => s.ClassId);
        // Supports enrollment count queries and recent-admissions ordering in dashboards.
        b.HasIndex(s => new { s.CampusId, s.Status, s.EnrollmentDate });

        b.HasOne(s => s.Campus).WithMany(c => c.Students).HasForeignKey(s => s.CampusId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(s => s.Parent).WithMany(p => p.Students).HasForeignKey(s => s.ParentId).OnDelete(DeleteBehavior.SetNull);
    }
}
