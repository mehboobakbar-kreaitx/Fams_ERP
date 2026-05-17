using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using FAMS.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FAMS.Application.Modules.CRM.Commands.BulkImportStudents;

public class BulkImportStudentsCommandHandler
    : IRequestHandler<BulkImportStudentsCommand, Result<BulkImportResult>>
{
    private readonly IFamsDbContext _db;
    private readonly ILogger<BulkImportStudentsCommandHandler> _logger;

    public BulkImportStudentsCommandHandler(IFamsDbContext db, ILogger<BulkImportStudentsCommandHandler> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<Result<BulkImportResult>> Handle(
        BulkImportStudentsCommand request, CancellationToken cancellationToken)
    {
        var errors = new List<string>();
        int imported = 0, skipped = 0;
        int rowNum = 1;

        foreach (var row in request.Rows)
        {
            rowNum++;
            try
            {
                if (string.IsNullOrWhiteSpace(row.FirstName) || string.IsNullOrWhiteSpace(row.RollNumber))
                {
                    errors.Add($"Row {rowNum}: FirstName and RollNumber are required.");
                    skipped++;
                    continue;
                }

                var rollExists = await _db.Students
                    .AnyAsync(s => s.CampusId == request.CampusId && s.RollNumber == row.RollNumber, cancellationToken);

                if (rollExists)
                {
                    errors.Add($"Row {rowNum}: Roll number '{row.RollNumber}' already exists — skipped.");
                    skipped++;
                    continue;
                }

                var student = Student.Create(
                    row.FirstName, row.LastName, row.FatherName,
                    row.DateOfBirth, row.Gender,
                    row.Address, row.Phone,
                    row.ProgramId, row.ClassId, row.SectionId,
                    row.RollNumber, row.EmergencyContactName, row.EmergencyContactPhone,
                    nic: null, bForm: null,
                    email: string.IsNullOrWhiteSpace(row.Email) ? null : row.Email,
                    bloodGroup: null);

                student.CampusId = request.CampusId;
                _db.Students.Add(student);
                imported++;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "BulkImport failed on row {Row}", rowNum);
                errors.Add($"Row {rowNum}: Unexpected error — {ex.Message}");
                skipped++;
            }
        }

        if (imported > 0)
            await _db.SaveChangesAsync(cancellationToken);

        return Result<BulkImportResult>.Success(new BulkImportResult(imported, skipped, errors));
    }
}
