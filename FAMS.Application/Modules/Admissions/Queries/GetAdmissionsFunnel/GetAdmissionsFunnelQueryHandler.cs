using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using FAMS.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.Admissions.Queries.GetAdmissionsFunnel;

public class GetAdmissionsFunnelQueryHandler : IRequestHandler<GetAdmissionsFunnelQuery, Result<AdmissionsFunnelDto>>
{
    private readonly IFamsDbContext _db;

    public GetAdmissionsFunnelQueryHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<AdmissionsFunnelDto>> Handle(GetAdmissionsFunnelQuery request, CancellationToken cancellationToken)
    {
        var query = _db.Applications.Where(a => a.CampusId == request.CampusId);
        if (request.ProgramId.HasValue) query = query.Where(a => a.ProgramId == request.ProgramId.Value);

        var counts = await query.GroupBy(a => a.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var dict = counts.ToDictionary(c => c.Status, c => c.Count);
        var orderedStages = new[]
        {
            ApplicationStatus.Inquiry, ApplicationStatus.Applied, ApplicationStatus.UnderReview,
            ApplicationStatus.Offered, ApplicationStatus.Enrolled
        };

        var stages = new List<FunnelStage>();
        int? previousCount = null;
        foreach (var stage in orderedStages)
        {
            var count = dict.GetValueOrDefault(stage, 0);
            var conversion = previousCount is null || previousCount == 0
                ? 100m
                : Math.Round((decimal)count / previousCount.Value * 100m, 2);
            stages.Add(new FunnelStage(stage.ToString(), count, conversion));
            previousCount = count;
        }

        var inquiryCount = dict.GetValueOrDefault(ApplicationStatus.Inquiry, 0)
                          + dict.GetValueOrDefault(ApplicationStatus.Applied, 0);
        var enrolledCount = dict.GetValueOrDefault(ApplicationStatus.Enrolled, 0);
        var overallConversion = inquiryCount == 0 ? 0m : Math.Round((decimal)enrolledCount / inquiryCount * 100m, 2);

        return Result<AdmissionsFunnelDto>.Success(new AdmissionsFunnelDto(stages, overallConversion));
    }
}
