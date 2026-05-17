namespace FAMS.Application.Common.Interfaces;

public interface ILmsService
{
    Task<LmsSyncResult> SyncCampusAsync(Guid campusId, CancellationToken ct = default);
    Task<LmsStatus> GetStatusAsync(CancellationToken ct = default);
}

public record LmsSyncResult(int CoursesUpserted, int EnrolmentsUpserted, IReadOnlyList<string> Warnings);
public record LmsStatus(bool Connected, string Provider, DateTime? LastSyncUtc);
