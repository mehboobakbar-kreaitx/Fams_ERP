using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using FAMS.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using AppResult = FAMS.Application.Common.Models.Result;

namespace FAMS.Application.Modules.Platform.Config.Commands.SaveGradingScale;

public class SaveGradingScaleCommandHandler
    : IRequestHandler<SaveGradingScaleCommand, AppResult>
{
    private readonly IFamsDbContext _db;

    public SaveGradingScaleCommandHandler(IFamsDbContext db) => _db = db;

    public async Task<AppResult> Handle(
        SaveGradingScaleCommand request, CancellationToken cancellationToken)
    {
        if (request.Rules.Count == 0)
            return AppResult.Failure("At least one grading rule is required.");

        // Remove existing default scale and recreate
        var existing = await _db.GradingScales
            .Include(g => g.Rules)
            .Where(g => g.ProgramId == null)
            .FirstOrDefaultAsync(cancellationToken);

        if (existing is not null)
        {
            foreach (var rule in existing.Rules.ToList())
                _db.GradingScaleRules.Remove(rule);
            _db.GradingScales.Remove(existing);
            await _db.SaveChangesAsync(cancellationToken);
        }

        var scale = GradingScale.Create("Default");
        _db.GradingScales.Add(scale);
        await _db.SaveChangesAsync(cancellationToken);

        foreach (var r in request.Rules)
        {
            var rule = GradingScaleRule.Create(scale.Id, r.MinPercent, r.MaxPercent, r.Grade, r.GpaPoint);
            _db.GradingScaleRules.Add(rule);
        }

        await _db.SaveChangesAsync(cancellationToken);
        return AppResult.Success();
    }
}
