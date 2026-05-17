using ClosedXML.Excel;
using FAMS.Application.Common.Interfaces;
using FAMS.Application.Modules.CRM.Commands.BulkImportStudents;
using FAMS.Application.Modules.CRM.Commands.CreateStudent;
using FAMS.Application.Modules.CRM.Commands.DeleteStudent;
using FAMS.Application.Modules.CRM.Commands.UpdateStudent;
using FAMS.Application.Modules.CRM.Commands.UpdateStudentStatus;
using FAMS.Application.Modules.CRM.Commands.UploadStudentDocument;
using FAMS.Application.Modules.CRM.Queries.GetStudentById;
using FAMS.Application.Modules.CRM.Queries.GetStudentDocuments;
using FAMS.Application.Modules.CRM.Queries.GetStudents;
using FAMS.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FAMS.API.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/[controller]")]
public class StudentsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public StudentsController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    [HttpGet]
    [Authorize(Roles = "SystemAdmin,Principal,AcademicCoordinator,HrOfficer,ProcurementOfficer,Accountant,Teacher,Executive")]
    public async Task<IActionResult> GetAll([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20,
        [FromQuery] string? searchTerm = null, [FromQuery] Guid? classId = null, [FromQuery] StudentStatus? status = null)
    {
        if (_currentUser.CampusId is null) return Forbid();
        var result = await _mediator.Send(new GetStudentsQuery(
            _currentUser.CampusId.Value, pageNumber, pageSize, searchTerm, classId, status));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Roles = "SystemAdmin,Principal,AcademicCoordinator,HrOfficer,ProcurementOfficer,Accountant,Teacher,Executive")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _mediator.Send(new GetStudentByIdQuery(id));
        return result.IsSuccess ? Ok(result.Value) : NotFound(result);
    }

    [HttpPost]
    [Authorize(Roles = "SystemAdmin,Principal,AcademicCoordinator")]
    public async Task<IActionResult> Create([FromBody] CreateStudentCommand command)
    {
        if (_currentUser.CampusId is null) return Forbid();
        var sanitized = command with { CampusId = _currentUser.CampusId.Value };
        var result = await _mediator.Send(sanitized);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetById), new { id = result.Value }, result.Value)
            : BadRequest(result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "SystemAdmin,Principal,AcademicCoordinator")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateStudentCommand command)
    {
        if (id != command.Id) return BadRequest("Route id and body id must match.");
        var result = await _mediator.Send(command);
        return result.IsSuccess ? NoContent() : BadRequest(result);
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = "SystemAdmin,Principal,AcademicCoordinator")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStudentStatusBody body)
    {
        var result = await _mediator.Send(new UpdateStudentStatusCommand(id, body.NewStatus, body.Reason));
        return result.IsSuccess ? NoContent() : BadRequest(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "SystemAdmin,Principal")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _mediator.Send(new DeleteStudentCommand(id));
        return result.IsSuccess ? NoContent() : BadRequest(result);
    }

    [HttpGet("{id:guid}/documents")]
    [Authorize(Roles = "SystemAdmin,Principal,AcademicCoordinator,HrOfficer,ProcurementOfficer,Accountant,Teacher,Executive")]
    public async Task<IActionResult> GetDocuments(Guid id)
    {
        var result = await _mediator.Send(new GetStudentDocumentsQuery(id));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result);
    }

    // ── Bulk Import ──────────────────────────────────────────────────────────

    [HttpGet("import-template")]
    [Authorize(Roles = "SystemAdmin,Principal,AcademicCoordinator")]
    public IActionResult ImportTemplate()
    {
        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add("Students");
        var headers = new[]
        {
            "FirstName*", "LastName*", "FatherName*", "DateOfBirth* (yyyy-MM-dd)",
            "Gender* (Male/Female/Other)", "RollNumber*", "Phone*", "Address*",
            "ProgramId* (GUID)", "ClassId* (GUID)", "SectionId* (GUID)",
            "EmergencyContactName*", "EmergencyContactPhone*", "Email"
        };
        for (int i = 0; i < headers.Length; i++)
        {
            ws.Cell(1, i + 1).Value = headers[i];
            ws.Cell(1, i + 1).Style.Font.Bold = true;
        }
        ws.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        wb.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "students-import-template.xlsx");
    }

    [HttpPost("import")]
    [Consumes("multipart/form-data")]
    [Authorize(Roles = "SystemAdmin,Principal,AcademicCoordinator")]
    public async Task<IActionResult> BulkImport(IFormFile file, CancellationToken ct)
    {
        if (_currentUser.CampusId is null) return Forbid();
        if (file is null || file.Length == 0) return BadRequest(new { error = "No file provided." });

        var parseErrors = new List<string>();
        var rows = new List<StudentImportRow>();

        using var stream = file.OpenReadStream();
        using var wb = new XLWorkbook(stream);
        var ws = wb.Worksheet(1);
        var dataRows = ws.RangeUsed()?.RowsUsed().Skip(1).ToList() ?? [];

        foreach (var row in dataRows)
        {
            var n = row.RowNumber();
            var firstName   = row.Cell(1).GetString().Trim();
            var lastName    = row.Cell(2).GetString().Trim();
            var fatherName  = row.Cell(3).GetString().Trim();
            var dobRaw      = row.Cell(4).GetString().Trim();
            var genderRaw   = row.Cell(5).GetString().Trim();
            var rollNumber  = row.Cell(6).GetString().Trim();
            var phone       = row.Cell(7).GetString().Trim();
            var address     = row.Cell(8).GetString().Trim();
            var programIdRaw = row.Cell(9).GetString().Trim();
            var classIdRaw  = row.Cell(10).GetString().Trim();
            var sectionIdRaw = row.Cell(11).GetString().Trim();
            var emergName   = row.Cell(12).GetString().Trim();
            var emergPhone  = row.Cell(13).GetString().Trim();
            var email       = row.Cell(14).GetString().Trim();

            if (!DateTime.TryParse(dobRaw, out var dob))
            { parseErrors.Add($"Row {n}: Invalid DateOfBirth '{dobRaw}'."); continue; }

            if (!Enum.TryParse<Gender>(genderRaw, ignoreCase: true, out var gender))
            { parseErrors.Add($"Row {n}: Invalid Gender '{genderRaw}'. Use Male/Female/Other."); continue; }

            if (!Guid.TryParse(programIdRaw, out var programId) ||
                !Guid.TryParse(classIdRaw, out var classId) ||
                !Guid.TryParse(sectionIdRaw, out var sectionId))
            { parseErrors.Add($"Row {n}: ProgramId/ClassId/SectionId must be valid GUIDs."); continue; }

            rows.Add(new StudentImportRow(firstName, lastName, fatherName, dob, gender,
                rollNumber, phone, address, programId, classId, sectionId,
                emergName, emergPhone, string.IsNullOrWhiteSpace(email) ? null : email));
        }

        if (parseErrors.Count > 0 && rows.Count == 0)
            return BadRequest(new { parseErrors });

        var result = await _mediator.Send(
            new BulkImportStudentsCommand(_currentUser.CampusId.Value, rows), ct);

        if (!result.IsSuccess) return BadRequest(result);

        var value = result.Value!;
        return Ok(new
        {
            value.Imported,
            value.Skipped,
            Errors = parseErrors.Concat(value.Errors).ToList()
        });
    }

    [HttpPost("{id:guid}/documents")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadDocument(
        Guid id, IFormFile file, [FromForm] string documentType)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "No file provided." });

        var command = new UploadStudentDocumentCommand
        {
            StudentId = id,
            DocumentType = documentType,
            FileName = Path.GetFileName(file.FileName),
            ContentType = file.ContentType,
            FileSize = file.Length,
            Content = file.OpenReadStream(),
        };

        var result = await _mediator.Send(command);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetDocuments), new { id }, new { documentId = result.Value })
            : BadRequest(result);
    }
}

public record UpdateStudentStatusBody(StudentStatus NewStatus, string Reason);

