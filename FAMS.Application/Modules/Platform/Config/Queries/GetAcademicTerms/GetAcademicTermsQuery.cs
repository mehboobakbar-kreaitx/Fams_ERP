using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Platform.Config.Queries.GetAcademicTerms;

public record GetAcademicTermsQuery : IRequest<Result<List<AcademicTermDto>>>;
