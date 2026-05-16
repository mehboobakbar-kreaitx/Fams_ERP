using FAMS.Domain.Common;

namespace FAMS.Domain.Entities;

public class FeeStructure : BaseAuditableEntity
{
    public Guid ProgramId { get; private set; }
    public string TermName { get; private set; } = string.Empty;
    public bool IsActive { get; private set; } = true;

    public AcademicProgram Program { get; private set; } = null!;
    public ICollection<FeeStructureHead> Heads { get; private set; } = new List<FeeStructureHead>();

    private FeeStructure() { }

    public static FeeStructure Create(Guid programId, string termName)
        => new() { ProgramId = programId, TermName = termName, IsActive = true };

    public void Deactivate() => IsActive = false;

    public decimal TotalAmount() => Heads.Sum(h => h.Amount);
}

public class FeeStructureHead : BaseAuditableEntity
{
    public Guid FeeStructureId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public decimal Amount { get; private set; }
    public int DueDayOfMonth { get; private set; }

    public FeeStructure Structure { get; private set; } = null!;

    private FeeStructureHead() { }

    public static FeeStructureHead Create(Guid feeStructureId, string name, decimal amount, int dueDayOfMonth = 10)
        => new()
        {
            FeeStructureId = feeStructureId,
            Name = name,
            Amount = amount,
            DueDayOfMonth = Math.Clamp(dueDayOfMonth, 1, 28),
        };
}
