using FAMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FAMS.Infrastructure.Persistence.Configurations;

public class ParentConfiguration : IEntityTypeConfiguration<Parent>
{
    public void Configure(EntityTypeBuilder<Parent> b)
    {
        b.ToTable("parents");
        b.HasKey(p => p.Id);
        b.Property(p => p.FirstName).HasMaxLength(100).IsRequired();
        b.Property(p => p.LastName).HasMaxLength(100).IsRequired();
        b.Property(p => p.CNIC).HasMaxLength(20).IsRequired();
        b.Property(p => p.Phone).HasMaxLength(20).IsRequired();
        b.Property(p => p.Email).HasMaxLength(150);
        b.Property(p => p.Relationship).HasMaxLength(30);
        b.HasIndex(p => p.CNIC);
    }
}
