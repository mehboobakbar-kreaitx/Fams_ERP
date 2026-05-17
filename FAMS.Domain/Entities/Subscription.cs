using FAMS.Domain.Common;

namespace FAMS.Domain.Entities;

public enum SubscriptionPlan { Free, Basic, Professional, Enterprise }

public enum SubscriptionStatus { Trial, Active, PastDue, Suspended, Cancelled }

public class Subscription : BaseAuditableEntity
{
    public Guid SchoolId { get; private set; }
    public SubscriptionPlan Plan { get; private set; }
    public SubscriptionStatus Status { get; private set; }
    public DateTime TrialEndsAt { get; private set; }
    public DateTime? PeriodStart { get; private set; }
    public DateTime? PeriodEnd { get; private set; }
    public int MaxCampuses { get; private set; }
    public int MaxStudentsPerCampus { get; private set; }
    public decimal MonthlyFeeUsd { get; private set; }
    public string? ExternalSubscriptionId { get; private set; }
    public string? Notes { get; private set; }

    public School School { get; private set; } = null!;

    private Subscription() { }

    public static Subscription CreateTrial(Guid schoolId, int trialDays = 30)
    {
        return new Subscription
        {
            SchoolId = schoolId,
            Plan = SubscriptionPlan.Free,
            Status = SubscriptionStatus.Trial,
            TrialEndsAt = DateTime.UtcNow.AddDays(trialDays),
            MaxCampuses = 1,
            MaxStudentsPerCampus = 200,
            MonthlyFeeUsd = 0m,
        };
    }

    public static Subscription CreatePaid(Guid schoolId, SubscriptionPlan plan,
        DateTime periodStart, DateTime periodEnd, string? externalId = null)
    {
        var (maxCampuses, maxStudents, fee) = plan switch
        {
            SubscriptionPlan.Basic        => (3, 500, 49m),
            SubscriptionPlan.Professional => (10, 2000, 149m),
            SubscriptionPlan.Enterprise   => (int.MaxValue, int.MaxValue, 499m),
            _                             => (1, 200, 0m),
        };

        return new Subscription
        {
            SchoolId = schoolId,
            Plan = plan,
            Status = SubscriptionStatus.Active,
            TrialEndsAt = DateTime.UtcNow,
            PeriodStart = periodStart,
            PeriodEnd = periodEnd,
            MaxCampuses = maxCampuses,
            MaxStudentsPerCampus = maxStudents,
            MonthlyFeeUsd = fee,
            ExternalSubscriptionId = externalId,
        };
    }

    public void Activate(DateTime periodStart, DateTime periodEnd, string? externalId = null)
    {
        Status = SubscriptionStatus.Active;
        PeriodStart = periodStart;
        PeriodEnd = periodEnd;
        ExternalSubscriptionId = externalId ?? ExternalSubscriptionId;
    }

    public void Suspend(string? notes = null)
    {
        Status = SubscriptionStatus.Suspended;
        Notes = notes;
    }

    public void Cancel(string? notes = null)
    {
        Status = SubscriptionStatus.Cancelled;
        Notes = notes;
    }

    public void MarkPastDue() => Status = SubscriptionStatus.PastDue;

    public bool IsActive => Status is SubscriptionStatus.Active or SubscriptionStatus.Trial
        && (Status != SubscriptionStatus.Trial || TrialEndsAt > DateTime.UtcNow);

    public bool CanAddCampus(int currentCampusCount) =>
        IsActive && currentCampusCount < MaxCampuses;

    public bool CanEnrollStudent(int currentStudentCount) =>
        IsActive && currentStudentCount < MaxStudentsPerCampus;
}
