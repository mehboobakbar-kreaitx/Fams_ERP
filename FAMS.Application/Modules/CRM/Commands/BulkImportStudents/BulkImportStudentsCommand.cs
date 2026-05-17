using FAMS.Application.Common.Models;
using FAMS.Domain.Enums;
using MediatR;

namespace FAMS.Application.Modules.CRM.Commands.BulkImportStudents;

public record BulkImportStudentsCommand(
    Guid CampusId,
    IReadOnlyList<StudentImportRow> Rows) : IRequest<Result<BulkImportResult>>;

public record StudentImportRow(
    string FirstName,
    string LastName,
    string FatherName,
    DateTime DateOfBirth,
    Gender Gender,
    string RollNumber,
    string Phone,
    string Address,
    Guid ProgramId,
    Guid ClassId,
    Guid SectionId,
    string EmergencyContactName,
    string EmergencyContactPhone,
    string? Email);

public record BulkImportResult(int Imported, int Skipped, IReadOnlyList<string> Errors);
