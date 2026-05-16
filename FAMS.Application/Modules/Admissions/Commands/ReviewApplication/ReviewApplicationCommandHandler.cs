using FAMS.Application.Common.Exceptions;
using FAMS.Application.Common.Interfaces;
using FAMS.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Result = FAMS.Application.Common.Models.Result;
using AppEntity = FAMS.Domain.Entities.Application;

namespace FAMS.Application.Modules.Admissions.Commands.ReviewApplication;

public class ReviewApplicationCommandHandler : IRequestHandler<ReviewApplicationCommand, Result>
{
    private readonly IFamsDbContext _db;
    private readonly IEmailService _email;
    private readonly ILogger<ReviewApplicationCommandHandler> _logger;

    public ReviewApplicationCommandHandler(IFamsDbContext db, IEmailService email,
        ILogger<ReviewApplicationCommandHandler> logger)
    {
        _db = db;
        _email = email;
        _logger = logger;
    }

    public async Task<Result> Handle(ReviewApplicationCommand request, CancellationToken cancellationToken)
    {
        var application = await _db.Applications.FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken)
            ?? throw new NotFoundException(nameof(AppEntity), request.ApplicationId);

        application.Review(request.NewStatus, request.ReviewNotes, request.ReviewedById);
        await _db.SaveChangesAsync(cancellationToken);

        try
        {
            if (request.NewStatus == ApplicationStatus.Offered)
            {
                var body = $"<p>Dear {application.FirstName},</p>" +
                           $"<p>Congratulations! You have been offered admission to Falcon College.</p>" +
                           $"<p>Please confirm your acceptance to complete enrollment.</p>";
                await _email.SendAsync(application.Email, "FAMS — Admission Offer", body, cancellationToken);
            }
            else if (request.NewStatus == ApplicationStatus.Declined)
            {
                var body = $"<p>Dear {application.FirstName},</p>" +
                           $"<p>Thank you for your interest. Unfortunately your application was not successful at this time.</p>" +
                           $"<p>Notes: {request.ReviewNotes}</p>";
                await _email.SendAsync(application.Email, "FAMS — Application Update", body, cancellationToken);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to send review notification for application {Id}", application.Id);
        }

        return Result.Success();
    }
}
