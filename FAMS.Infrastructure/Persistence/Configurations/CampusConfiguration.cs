using FAMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FAMS.Infrastructure.Persistence.Configurations;

public class CampusConfiguration : IEntityTypeConfiguration<Campus>
{
    public void Configure(EntityTypeBuilder<Campus> b)
    {
        b.ToTable("campuses");
        b.HasKey(c => c.Id);
        b.Property(c => c.Name).HasMaxLength(150).IsRequired();
        b.Property(c => c.Code).HasMaxLength(20).IsRequired();
        b.Property(c => c.City).HasMaxLength(80).IsRequired();
        b.Property(c => c.Email).HasMaxLength(150);
        b.Property(c => c.IsMainCampus).HasDefaultValue(false);
        b.HasIndex(c => c.Code).IsUnique();
        b.HasIndex(c => c.IsMainCampus);
    }
}
