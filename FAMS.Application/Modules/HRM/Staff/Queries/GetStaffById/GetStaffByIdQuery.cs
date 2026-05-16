using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.HRM.Staff.Queries.GetStaffById;

public record GetStaffByIdQuery(Guid Id) : IRequest<Result<StaffDetailDto>>;
