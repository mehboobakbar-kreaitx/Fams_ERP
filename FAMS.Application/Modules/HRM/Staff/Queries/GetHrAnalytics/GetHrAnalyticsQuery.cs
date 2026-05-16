using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.HRM.Staff.Queries.GetHrAnalytics;

public record GetHrAnalyticsQuery(Guid CampusId) : IRequest<Result<HrAnalyticsDto>>;
