using FAMS.Application.Common.Models;
using FAMS.Domain.Enums;
using MediatR;

namespace FAMS.Application.Modules.Admissions.Commands.SubmitApplication;

public record SubmitApplicationCommand(
    string FirstName,
    string LastName,
    string FatherName,
    DateTime DateOfBirth,
    Gender Gender,
    string Phone,
    string Email,
    string Address,
    Guid ProgramId,
    Guid CampusId,
    List<string>? DocumentUrls = null) : IRequest<Result<Guid>>;
