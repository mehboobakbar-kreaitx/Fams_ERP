using FAMS.Domain.Common;

namespace FAMS.Domain.Entities;

public class GradingScale : BaseAuditableEntity
{
    public string Name { get; private set; } = string.Empty;
    public Guid? ProgramId { get; private set; }
    public bool IsActive { get; private set; } = true;

    public ICollection<GradingScaleRule> Rules { get; private set; } = new List<GradingScaleRule>();

    private GradingScale() { }

    public static GradingScale Create(string name, Guid? programId = null)
        => new() { Name = name, ProgramId = programId, IsActive = true };
}

public class GradingScaleRule : BaseAuditableEntity
{
    public Guid GradingScaleId { get; private set; }
    public decimal MinPercent { get; private set; }
    public decimal MaxPercent { get; private set; }
    public string Grade { get; private set; } = string.Empty;
    public decimal GpaPoint { get; private set; }

    public GradingScale Scale { get; private set; } = null!;

    private GradingScaleRule() { }

    public static GradingScaleRule Create(Guid scaleId, decimal min, decimal max, string grade, decimal gpa)
        => new()
        {
            GradingScaleId = scaleId,
            MinPercent = min,
            MaxPercent = max,
            Grade = grade,
            GpaPoint = gpa,
        };
}
