using FAMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FAMS.Infrastructure.Persistence.Configurations;

public class TimetableSlotConfiguration : IEntityTypeConfiguration<TimetableSlot>
{
    public void Configure(EntityTypeBuilder<TimetableSlot> b)
    {
        b.ToTable("timetable_slots");
        b.HasKey(t => t.Id);
        b.Property(t => t.DayOfWeek).HasConversion<int>();
        b.Property(t => t.TermName).HasMaxLength(50).IsRequired();
        b.Property(t => t.Room).HasMaxLength(50);
        b.HasIndex(t => new { t.SectionId, t.TermName, t.DayOfWeek });
        b.HasIndex(t => new { t.TeacherId, t.TermName, t.DayOfWeek });
        b.HasOne(t => t.Section).WithMany().HasForeignKey(t => t.SectionId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(t => t.Subject).WithMany().HasForeignKey(t => t.SubjectId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(t => t.Teacher).WithMany().HasForeignKey(t => t.TeacherId).OnDelete(DeleteBehavior.Restrict);
    }
}
