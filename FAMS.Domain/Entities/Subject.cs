using FAMS.Domain.Common;

namespace FAMS.Domain.Entities;

public class Subject : BaseAuditableEntity
{
    public string Name { get; private set; } = string.Empty;
    public string Code { get; private set; } = string.Empty;
    public int CreditHours { get; private set; }
    public Guid ProgramId { get; private set; }
    public bool IsElective { get; private set; }

    private Subject() { }

    public static Subject Create(string name, string code, int creditHours, Guid programId, bool isElective = false)
    {
        return new Subject
        {
            Name = name,
            Code = code,
            CreditHours = creditHours,
            ProgramId = programId,
            IsElective = isElective
        };
    }
}
