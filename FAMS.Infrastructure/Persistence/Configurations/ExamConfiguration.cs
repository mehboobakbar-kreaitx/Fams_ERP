using FAMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FAMS.Infrastructure.Persistence.Configurations;

public class ExamConfiguration : IEntityTypeConfiguration<Exam>
{
    public void Configure(EntityTypeBuilder<Exam> b)
    {
        b.ToTable("exams");
        b.HasKey(e => e.Id);
        b.Property(e => e.Name).HasMaxLength(150).IsRequired();
        b.Property(e => e.ExamType).HasMaxLength(50).IsRequired();
        b.Property(e => e.TermName).HasMaxLength(50).IsRequired();
        b.HasIndex(e => new { e.ClassId, e.TermName, e.ExamType }).IsUnique();
        b.HasOne(e => e.Class).WithMany().HasForeignKey(e => e.ClassId).OnDelete(DeleteBehavior.Restrict);
        b.HasMany(e => e.ScheduleItems).WithOne(s => s.Exam).HasForeignKey(s => s.ExamId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class ExamScheduleItemConfiguration : IEntityTypeConfiguration<ExamScheduleItem>
{
    public void Configure(EntityTypeBuilder<ExamScheduleItem> b)
    {
        b.ToTable("exam_schedule_items");
        b.HasKey(e => e.Id);
        b.Property(e => e.TotalMarks).HasPrecision(8, 2);
        b.Property(e => e.Hall).HasMaxLength(50);
        b.HasIndex(e => new { e.ExamId, e.SubjectId }).IsUnique();
        b.HasOne(e => e.Subject).WithMany().HasForeignKey(e => e.SubjectId).OnDelete(DeleteBehavior.Restrict);
    }
}
