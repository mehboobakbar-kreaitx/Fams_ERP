using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using AppEntity = FAMS.Domain.Entities.Application;

namespace FAMS.Application.Modules.Admissions.Commands.SubmitApplication;

public class SubmitApplicationCommandHandler : IRequestHandler<SubmitApplicationCommand, Result<Guid>>
{
    private readonly IFamsDbContext _db;
    private readonly IEmailService _email;
    private readonly ILogger<SubmitApplicationCommandHandler> _logger;

    public SubmitApplicationCommandHandler(IFamsDbContext db, IEmailService email,
        ILogger<SubmitApplicationCommandHandler> logger)
    {
        _db = db;
        _email = email;
        _logger = logger;
    }

    public async Task<Result<Guid>> Handle(SubmitApplicationCommand request, CancellationToken cancellationToken)
    {
        var campusExists = await _db.Campuses
            .AnyAsync(c => c.Id == request.CampusId && !c.IsDeleted, cancellationToken);
        if (!campusExists)
            return Result<Guid>.Failure("The specified campus does not exist.");

        var application = AppEntity.Create(
            request.FirstName, request.LastName, request.FatherName,
            request.DateOfBirth, request.Gender, request.Phone, request.Email, request.Address,
            request.ProgramId, request.CampusId, request.DocumentUrls);

        _db.Applications.Add(application);
        await _db.SaveChangesAsync(cancellationToken);

        try
        {
            var body = $"<p>Dear {request.FirstName},</p>" +
                       $"<p>We have received your application to Falcon College. Your application ID is <strong>{application.Id}</strong>.</p>" +
                       $"<p>You will be notified once the review is complete.</p>" +
                       $"<p>— Falcon College Admissions</p>";
            await _email.SendAsync(request.Email, "FAMS — Application Received", body, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to send confirmation email to {Email}", request.Email);
        }

        return Result<Guid>.Success(application.Id);
    }
}
