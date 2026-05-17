using FAMS.Application.Common.Exceptions;
using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using FAMS.Domain.Entities;
using FAMS.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using AppEntity = FAMS.Domain.Entities.Application;

namespace FAMS.Application.Modules.Admissions.Commands.EnrollApplicant;

public class EnrollApplicantCommandHandler : IRequestHandler<EnrollApplicantCommand, Result<Guid>>
{
    private readonly IFamsDbContext _db;
    private readonly IIdentityService _identity;
    private readonly IEmailService _email;
    private readonly ILogger<EnrollApplicantCommandHandler> _logger;

    public EnrollApplicantCommandHandler(
        IFamsDbContext db,
        IIdentityService identity,
        IEmailService email,
        ILogger<EnrollApplicantCommandHandler> logger)
    {
        _db = db;
        _identity = identity;
        _email = email;
        _logger = logger;
    }

    public async Task<Result<Guid>> Handle(EnrollApplicantCommand request, CancellationToken cancellationToken)
    {
        var application = await _db.Applications
            .FirstOrDefaultAsync(a => a.Id == request.ApplicationId, cancellationToken)
            ?? throw new NotFoundException(nameof(AppEntity), request.ApplicationId);

        if (application.Status != ApplicationStatus.Offered)
            return Result<Guid>.Failure($"Only applications in 'Offered' status can be enrolled. Current status: {application.Status}.");

        var rollExists = await _db.Students
            .AnyAsync(s => s.CampusId == application.CampusId && s.RollNumber == request.RollNumber, cancellationToken);
        if (rollExists)
            return Result<Guid>.Failure($"Roll number '{request.RollNumber}' already exists in this campus.");

        var student = Student.Create(
            application.FirstName,
            application.LastName,
            application.FatherName,
            application.DateOfBirth,
            application.Gender,
            application.Address,
            application.Phone,
            application.ProgramId,
            request.ClassId,
            request.SectionId,
            request.RollNumber,
            request.EmergencyContactName,
            request.EmergencyContactPhone,
            email: application.Email);

        student.CampusId = application.CampusId;

        // ── Parent linkage ────────────────────────────────────────────────────
        if (!string.IsNullOrWhiteSpace(request.ParentCnic))
        {
            var parent = await _db.Parents
                .FirstOrDefaultAsync(p => p.CampusId == application.CampusId && p.CNIC == request.ParentCnic, cancellationToken);

            if (parent is null)
            {
                parent = Parent.Create(
                    request.ParentFirstName!,
                    request.ParentLastName!,
                    request.ParentCnic,
                    request.ParentPhone!,
                    request.ParentAddress!,
                    request.ParentRelationship!,
                    request.ParentEmail);
                parent.CampusId = application.CampusId;
                _db.Parents.Add(parent);
                await _db.SaveChangesAsync(cancellationToken);
            }

            student.AssignParent(parent.Id);

            // Activate parent portal if email is available and not yet enabled
            if (!string.IsNullOrWhiteSpace(request.ParentEmail) && !parent.PortalAccessEnabled)
            {
                var existingParentAccount = await _identity.FindByEmailAsync(request.ParentEmail);
                if (existingParentAccount is null)
                {
                    var parentTempPwd = $"FAMS@{request.ParentCnic[..5]}";
                    var (parentOk, _, parentErr) = await _identity.CreateUserAsync(
                        request.ParentEmail, parentTempPwd,
                        request.ParentFirstName!, request.ParentLastName!,
                        schoolId: null, campusId: application.CampusId, role: "Parent");

                    if (parentOk)
                        parent.EnablePortalAccess();
                    else
                        _logger.LogWarning("Could not create parent portal for CNIC {Cnic}: {Error}", request.ParentCnic, parentErr);
                }
                else
                {
                    parent.EnablePortalAccess();
                }
            }
        }

        _db.Students.Add(student);
        application.Review(ApplicationStatus.Enrolled, "Enrolled via admission process.", Guid.Empty);

        await _db.SaveChangesAsync(cancellationToken);

        // ── Student portal credentials ─────────────────────────────────────────
        var tempPassword = $"FAMS@{request.RollNumber}";
        var existingAccount = await _identity.FindByEmailAsync(application.Email);
        if (existingAccount is null)
        {
            var (succeeded, _, error) = await _identity.CreateUserAsync(
                application.Email, tempPassword,
                application.FirstName, application.LastName,
                schoolId: null, campusId: application.CampusId, role: "Student");

            if (!succeeded)
                _logger.LogWarning("Could not create portal account for student {Id}: {Error}", student.Id, error);
        }
        else
        {
            _logger.LogInformation("Portal account already exists for student email {Email}; skipping creation", application.Email);
        }

        try
        {
            var body = $"<p>Dear {application.FirstName},</p>" +
                       $"<p>Congratulations! You have been enrolled. Your student portal credentials are:</p>" +
                       $"<p><strong>Email:</strong> {application.Email}<br/>" +
                       $"<strong>Temporary Password:</strong> {tempPassword}</p>" +
                       $"<p>Please change your password upon first login.</p>";
            await _email.SendAsync(application.Email, "FAMS — Enrollment Confirmed", body, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to send enrollment email for student {Id}", student.Id);
        }

        return Result<Guid>.Success(student.Id);
    }
}
