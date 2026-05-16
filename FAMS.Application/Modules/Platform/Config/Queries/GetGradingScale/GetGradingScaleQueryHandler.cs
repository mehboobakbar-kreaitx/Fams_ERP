using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.Platform.Config.Queries.GetGradingScale;

public class GetGradingScaleQueryHandler
    : IRequestHandler<GetGradingScaleQuery, Result<GradingScaleDto>>
{
    private readonly IFamsDbContext _db;

    public GetGradingScaleQueryHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<GradingScaleDto>> Handle(
        GetGradingScaleQuery request, CancellationToken cancellationToken)
    {
        var scale = await _db.GradingScales.AsNoTracking()
            .Include(g => g.Rules)
            .Where(g => g.ProgramId == null)
            .FirstOrDefaultAsync(cancellationToken);

        if (scale is null)
        {
            var defaults = DefaultRules();
            return Result<GradingScaleDto>.Success(new GradingScaleDto(null, defaults));
        }

        var rules = scale.Rules
            .OrderByDescending(r => r.MinPercent)
            .Select(r => new GradingRuleDto(r.Id, r.Grade, r.MinPercent, r.MaxPercent, r.GpaPoint))
            .ToList();

        return Result<GradingScaleDto>.Success(new GradingScaleDto(scale.Id, rules));
    }

    private static List<GradingRuleDto> DefaultRules() =>
    [
        new(null, "A+", 90, 100, 4.0m),
        new(null, "A",  80, 89,  4.0m),
        new(null, "B",  70, 79,  3.0m),
        new(null, "C",  60, 69,  2.0m),
        new(null, "D",  50, 59,  1.0m),
        new(null, "F",  0,  49,  0.0m),
    ];
}
