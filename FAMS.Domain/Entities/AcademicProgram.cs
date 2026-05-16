using FAMS.Domain.Common;

namespace FAMS.Domain.Entities;

public class AcademicProgram : BaseAuditableEntity
{
    public string Name { get; private set; } = string.Empty;
    public string Code { get; private set; } = string.Empty;
    public int DurationYears { get; private set; }
    public string? Description { get; private set; }
    public bool IsActive { get; private set; } = true;

    private AcademicProgram() { }

    public static AcademicProgram Create(string name, string code, int durationYears, string? description = null)
    {
        return new AcademicProgram
        {
            Name = name,
            Code = code,
            DurationYears = durationYears,
            Description = description,
            IsActive = true
        };
    }

    public void Deactivate() => IsActive = false;
}
