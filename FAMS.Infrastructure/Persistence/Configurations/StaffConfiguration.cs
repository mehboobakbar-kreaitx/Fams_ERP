using FAMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FAMS.Infrastructure.Persistence.Configurations;

public class StaffConfiguration : IEntityTypeConfiguration<Staff>
{
    public void Configure(EntityTypeBuilder<Staff> b)
    {
        b.ToTable("staff");
        b.HasKey(s => s.Id);
        b.Property(s => s.FirstName).HasMaxLength(100).IsRequired();
        b.Property(s => s.LastName).HasMaxLength(100).IsRequired();
        b.Property(s => s.CNIC).HasMaxLength(20).IsRequired();
        b.Property(s => s.Email).HasMaxLength(150).IsRequired();
        b.Property(s => s.Phone).HasMaxLength(20).IsRequired();
        b.Property(s => s.BasicSalary).HasPrecision(14, 2);
        b.Property(s => s.Gender).HasConversion<int>();
        b.HasIndex(s => s.CNIC).IsUnique();
        b.HasIndex(s => s.Email).IsUnique();
        b.HasOne(s => s.Campus).WithMany(c => c.StaffMembers).HasForeignKey(s => s.CampusId).OnDelete(DeleteBehavior.Restrict);
    }
}
