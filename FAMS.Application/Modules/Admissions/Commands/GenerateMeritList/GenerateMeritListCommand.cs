using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Admissions.Commands.GenerateMeritList;

public record MeritListEntry(Guid ApplicationId, string Name, decimal? TestMarks, int Rank, string Status);

public record GenerateMeritListCommand(Guid ProgramId, Guid CampusId, string TermName)
    : IRequest<Result<List<MeritListEntry>>>;
