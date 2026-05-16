using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using FAMS.Domain.Entities;
using FAMS.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.Finance.Fee.Commands.GenerateInvoices;

public class GenerateInvoicesCommandHandler : IRequestHandler<GenerateInvoicesCommand, Result<int>>
{
    private readonly IFamsDbContext _db;

    public GenerateInvoicesCommandHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<int>> Handle(GenerateInvoicesCommand request, CancellationToken cancellationToken)
    {
        var activeStudents = await _db.Students
            .Where(s => s.CampusId == request.CampusId && s.Status == StudentStatus.Active)
            .Select(s => s.Id)
            .ToListAsync(cancellationToken);

        var existingList = await _db.FeeInvoices
            .Where(i => i.CampusId == request.CampusId && i.TermName == request.TermName)
            .Select(i => i.StudentId)
            .ToListAsync(cancellationToken);
        var existing = existingList.ToHashSet();

        var toCreate = activeStudents.Where(id => !existing.Contains(id)).ToList();
        var sequence = await _db.FeeInvoices.CountAsync(cancellationToken) + 1;

        foreach (var studentId in toCreate)
        {
            var invoiceNumber = $"INV-{DateTime.UtcNow:yyyyMM}-{sequence++:D6}";
            var invoice = FeeInvoice.Create(studentId, invoiceNumber, DateTime.UtcNow,
                request.DueDate, request.DefaultTermFee, request.TermName);
            invoice.CampusId = request.CampusId;
            _db.FeeInvoices.Add(invoice);
        }

        await _db.SaveChangesAsync(cancellationToken);
        return Result<int>.Success(toCreate.Count);
    }
}
