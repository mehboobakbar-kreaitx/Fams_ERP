namespace FAMS.Domain.Common;

public abstract class BaseAuditableEntity : BaseEntity
{
    public DateTime? DeletedAt { get; set; }
    public string? DeletedBy { get; set; }
}
