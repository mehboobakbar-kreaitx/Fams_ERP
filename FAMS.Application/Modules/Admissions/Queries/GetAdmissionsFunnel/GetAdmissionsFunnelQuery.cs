using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Admissions.Queries.GetAdmissionsFunnel;

public record GetAdmissionsFunnelQuery(Guid CampusId, Guid? ProgramId = null) : IRequest<Result<AdmissionsFunnelDto>>;
