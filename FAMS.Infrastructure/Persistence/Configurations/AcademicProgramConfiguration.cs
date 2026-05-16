using FAMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FAMS.Infrastructure.Persistence.Configurations;

public class AcademicProgramConfiguration : IEntityTypeConfiguration<AcademicProgram>
{
    public void Configure(EntityTypeBuilder<AcademicProgram> b)
    {
        b.ToTable("programs");
        b.HasKey(p => p.Id);
        b.Property(p => p.Name).HasMaxLength(120).IsRequired();
        b.Property(p => p.Code).HasMaxLength(20).IsRequired();
        b.Property(p => p.Description).HasMaxLength(500);
        b.HasIndex(p => p.Code).IsUnique();
    }
}

public class ClassRoomConfiguration : IEntityTypeConfiguration<ClassRoom>
{
    public void Configure(EntityTypeBuilder<ClassRoom> b)
    {
        b.ToTable("classrooms");
        b.HasKey(c => c.Id);
        b.Property(c => c.Name).HasMaxLength(80).IsRequired();
        b.Property(c => c.Code).HasMaxLength(20).IsRequired();
        b.HasOne(c => c.Program).WithMany().HasForeignKey(c => c.ProgramId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class SectionConfiguration : IEntityTypeConfiguration<Section>
{
    public void Configure(EntityTypeBuilder<Section> b)
    {
        b.ToTable("sections");
        b.HasKey(s => s.Id);
        b.Property(s => s.Name).HasMaxLength(50).IsRequired();
        b.HasOne(s => s.ClassRoom).WithMany(c => c.Sections).HasForeignKey(s => s.ClassRoomId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(s => s.Teacher).WithMany().HasForeignKey(s => s.TeacherId).OnDelete(DeleteBehavior.SetNull);
    }
}

public class SubjectConfiguration : IEntityTypeConfiguration<Subject>
{
    public void Configure(EntityTypeBuilder<Subject> b)
    {
        b.ToTable("subjects");
        b.HasKey(s => s.Id);
        b.Property(s => s.Name).HasMaxLength(120).IsRequired();
        b.Property(s => s.Code).HasMaxLength(20).IsRequired();
        b.HasIndex(s => new { s.ProgramId, s.Code }).IsUnique();
    }
}
