using FAMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using AppEntity = FAMS.Domain.Entities.Application;

namespace FAMS.Infrastructure.Persistence.Configurations;

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> b)
    {
        b.ToTable("audit_logs");
        b.HasKey(a => a.Id);
        b.Property(a => a.EntityName).HasMaxLength(80).IsRequired();
        b.Property(a => a.EntityId).HasMaxLength(80);
        b.Property(a => a.Action).HasMaxLength(40).IsRequired();
        b.Property(a => a.UserId).HasMaxLength(80);
        b.Property(a => a.UserName).HasMaxLength(150);
        b.Property(a => a.IpAddress).HasMaxLength(45);
        b.HasIndex(a => new { a.EntityName, a.EntityId });
        b.HasIndex(a => a.Timestamp);
    }
}

public class ApplicationEntityConfiguration : IEntityTypeConfiguration<AppEntity>
{
    public void Configure(EntityTypeBuilder<AppEntity> b)
    {
        b.ToTable("applications");
        b.HasKey(a => a.Id);
        b.Property(a => a.FirstName).HasMaxLength(100).IsRequired();
        b.Property(a => a.LastName).HasMaxLength(100).IsRequired();
        b.Property(a => a.FatherName).HasMaxLength(100).IsRequired();
        b.Property(a => a.Phone).HasMaxLength(20);
        b.Property(a => a.Email).HasMaxLength(150).IsRequired();
        b.Property(a => a.Address).HasMaxLength(300);
        b.Property(a => a.Status).HasConversion<int>();
        b.Property(a => a.Gender).HasConversion<int>();
        b.Property(a => a.TestMarks).HasPrecision(8, 2);
        b.Property(a => a.ReviewNotes).HasMaxLength(1000);
        b.Property(a => a.DocumentUrls)
            .HasConversion(
                v => string.Join(';', v),
                v => string.IsNullOrEmpty(v) ? new List<string>() : v.Split(';', StringSplitOptions.RemoveEmptyEntries).ToList())
            .Metadata.SetValueComparer(new ValueComparer<List<string>>(
                (c1, c2) => (c1 ?? new List<string>()).SequenceEqual(c2 ?? new List<string>()),
                c => c == null ? 0 : c.Aggregate(0, (h, v) => HashCode.Combine(h, v.GetHashCode())),
                c => c == null ? new List<string>() : c.ToList()));
        b.HasIndex(a => new { a.CampusId, a.Status });
    }
}
