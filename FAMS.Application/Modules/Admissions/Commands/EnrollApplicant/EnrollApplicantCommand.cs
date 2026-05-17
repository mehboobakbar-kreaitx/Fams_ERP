using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Admissions.Commands.EnrollApplicant;

public record EnrollApplicantCommand(
    Guid ApplicationId,
    Guid ClassId,
    Guid SectionId,
    string RollNumber,
    string EmergencyContactName,
    string EmergencyContactPhone) : IRequest<Result<Guid>>;
