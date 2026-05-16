using FAMS.Domain.Common;

namespace FAMS.Domain.Entities;

public enum AppraisalStage { SelfReview = 1, ManagerReview = 2, PrincipalApproved = 3 }

public class Appraisal : BaseAuditableEntity
{
    public Guid StaffId { get; private set; }
    public DateTime PeriodStart { get; private set; }
    public DateTime PeriodEnd { get; private set; }
    public int? SelfRating { get; private set; }   // 1-5
    public int? ManagerRating { get; private set; } // 1-5
    public string? SelfComments { get; private set; }
    public string? ManagerComments { get; private set; }
    public string? GoalsMet { get; private set; }
    public AppraisalStage Stage { get; private set; } = AppraisalStage.SelfReview;
    public Guid? ApprovedById { get; private set; }

    public Staff Staff { get; private set; } = null!;

    private Appraisal() { }

    public static Appraisal Create(Guid staffId, DateTime periodStart, DateTime periodEnd)
        => new()
        {
            StaffId = staffId,
            PeriodStart = DateTime.SpecifyKind(periodStart, DateTimeKind.Utc),
            PeriodEnd = DateTime.SpecifyKind(periodEnd, DateTimeKind.Utc),
            Stage = AppraisalStage.SelfReview,
        };

    public void SubmitSelf(int rating, string? comments, string? goalsMet)
    {
        SelfRating = rating;
        SelfComments = comments;
        GoalsMet = goalsMet;
        Stage = AppraisalStage.ManagerReview;
    }

    public void SubmitManager(int rating, string? comments)
    {
        ManagerRating = rating;
        ManagerComments = comments;
        Stage = AppraisalStage.PrincipalApproved;
    }

    public void Approve(Guid approverId) { ApprovedById = approverId; }
}
