using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using FAMS.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.Platform.Config.Commands.CreateFeeStructure;

public class CreateFeeStructureCommandHandler
    : IRequestHandler<CreateFeeStructureCommand, Result<Guid>>
{
    private readonly IFamsDbContext _db;

    public CreateFeeStructureCommandHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<Guid>> Handle(
        CreateFeeStructureCommand request, CancellationToken cancellationToken)
    {
        var programExists = await _db.Programs.AnyAsync(p => p.Id == request.ProgramId, cancellationToken);
        if (!programExists)
            return Result<Guid>.Failure("Program not found.");

        var structure = FeeStructure.Create(request.ProgramId, request.TermName.Trim());
        _db.FeeStructures.Add(structure);
        await _db.SaveChangesAsync(cancellationToken);

        var head = FeeStructureHead.Create(
            structure.Id,
            request.FeeHeadName.Trim(),
            request.Amount,
            request.DueDayOfMonth);
        _db.FeeStructureHeads.Add(head);
        await _db.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(structure.Id);
    }
}
