using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.Platform.Config.Queries.GetFeeStructures;

public class GetFeeStructuresQueryHandler
    : IRequestHandler<GetFeeStructuresQuery, Result<List<FeeStructureDto>>>
{
    private readonly IFamsDbContext _db;

    public GetFeeStructuresQueryHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<List<FeeStructureDto>>> Handle(
        GetFeeStructuresQuery request, CancellationToken cancellationToken)
    {
        var structures = await _db.FeeStructures.AsNoTracking()
            .Include(f => f.Heads)
            .Include(f => f.Program)
            .OrderBy(f => f.Program.Name)
            .ToListAsync(cancellationToken);

        var dtos = structures.Select(f => new FeeStructureDto(
            f.Id,
            f.TermName,
            f.Program.Name,
            f.Heads.Sum(h => h.Amount),
            f.IsActive,
            f.Heads.Select(h => new FeeHeadDto(h.Id, h.Name, h.Amount, h.DueDayOfMonth)).ToList()
        )).ToList();

        return Result<List<FeeStructureDto>>.Success(dtos);
    }
}
