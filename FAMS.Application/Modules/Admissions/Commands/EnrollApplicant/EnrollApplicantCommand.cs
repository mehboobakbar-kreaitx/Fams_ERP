using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Admissions.Commands.EnrollApplicant;

public record EnrollApplicantCommand(
    Guid ApplicationId,
    Guid ClassId,
    Guid SectionId,
    string RollNumber,
    string EmergencyContactName,
    string EmergencyContactPhone,
    // Optional parent fields — if CNIC is supplied a Parent record is created/linked
    string? ParentFirstName = null,
    string? ParentLastName = null,
    string? ParentCnic = null,
    string? ParentPhone = null,
    string? ParentEmail = null,
    string? ParentRelationship = null,
    string? ParentAddress = null) : IRequest<Result<Guid>>;
