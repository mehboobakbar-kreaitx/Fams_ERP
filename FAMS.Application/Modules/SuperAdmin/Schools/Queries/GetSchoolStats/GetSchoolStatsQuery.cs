using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.SuperAdmin.Schools.Queries.GetSchoolStats;

public record GetSchoolStatsQuery(Guid SchoolId) : IRequest<Result<SchoolStatsDto>>;

public record SchoolStatsDto(
    int CampusCount,
    int StudentCount,
    int StaffCount,
    decimal MonthlyRevenue,
    decimal AttendanceRate);
