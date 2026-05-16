using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.CRM.Commands.UpdateStudent;

public record UpdateStudentCommand(
    Guid Id,
    string FirstName,
    string LastName,
    string Address,
    string Phone,
    string? Email,
    string EmergencyContactName,
    string EmergencyContactPhone,
    string? MedicalNotes,
    string? BloodGroup) : IRequest<Result>;
