using FAMS.Domain.Common;

namespace FAMS.Domain.Entities;

public class ClassRoom : BaseAuditableEntity
{
    public string Name { get; private set; } = string.Empty;
    public string Code { get; private set; } = string.Empty;
    public Guid ProgramId { get; private set; }
    public int Year { get; private set; }
    public bool IsActive { get; private set; } = true;

    public AcademicProgram Program { get; private set; } = null!;
    public ICollection<Section> Sections { get; private set; } = new List<Section>();

    private ClassRoom() { }

    public static ClassRoom Create(string name, string code, Guid programId, int year)
    {
        return new ClassRoom
        {
            Name = name,
            Code = code,
            ProgramId = programId,
            Year = year,
            IsActive = true
        };
    }
}
