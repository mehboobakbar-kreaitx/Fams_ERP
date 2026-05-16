using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using FAMS.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.Platform.Config.Commands.CreateAcademicTerm;

public class CreateAcademicTermCommandHandler
    : IRequestHandler<CreateAcademicTermCommand, Result<Guid>>
{
    private readonly IFamsDbContext _db;

    public CreateAcademicTermCommandHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<Guid>> Handle(
        CreateAcademicTermCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return Result<Guid>.Failure("Term name is required.");

        if (request.EndDate <= request.StartDate)
            return Result<Guid>.Failure("End date must be after start date.");

        var exists = await _db.AcademicTerms.AnyAsync(t => t.Name == request.Name, cancellationToken);
        if (exists)
            return Result<Guid>.Failure($"A term named '{request.Name}' already exists.");

        var term = AcademicTerm.Create(request.Name, request.StartDate, request.EndDate);
        _db.AcademicTerms.Add(term);
        await _db.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(term.Id);
    }
}
