using FAMS.Application.Common.Models;
using FAMS.Domain.Enums;
using MediatR;

namespace FAMS.Application.Modules.Admissions.Commands.ReviewApplication;

public record ReviewApplicationCommand(
    Guid ApplicationId,
    ApplicationStatus NewStatus,
    string ReviewNotes,
    Guid ReviewedById) : IRequest<Result>;
