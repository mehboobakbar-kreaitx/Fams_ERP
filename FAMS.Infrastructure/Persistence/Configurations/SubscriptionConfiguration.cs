using FAMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FAMS.Infrastructure.Persistence.Configurations;

public class SubscriptionConfiguration : IEntityTypeConfiguration<Subscription>
{
    public void Configure(EntityTypeBuilder<Subscription> b)
    {
        b.ToTable("subscriptions");
        b.HasKey(s => s.Id);
        b.Property(s => s.Plan).HasConversion<int>();
        b.Property(s => s.Status).HasConversion<int>();
        b.Property(s => s.MonthlyFeeUsd).HasPrecision(10, 2);
        b.Property(s => s.ExternalSubscriptionId).HasMaxLength(200);
        b.Property(s => s.Notes).HasMaxLength(1000);
        b.HasIndex(s => s.SchoolId).IsUnique();
        b.HasIndex(s => s.Status);
        b.HasOne(s => s.School)
         .WithMany()
         .HasForeignKey(s => s.SchoolId)
         .OnDelete(DeleteBehavior.Restrict);
    }
}
