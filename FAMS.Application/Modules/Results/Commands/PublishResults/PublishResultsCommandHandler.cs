using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using FAMS.Application.Common.Notifications.Events;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.Results.Commands.PublishResults;

public class PublishResultsCommandHandler : IRequestHandler<PublishResultsCommand, Result<int>>
{
    private readonly IFamsDbContext _db;
    private readonly IPublisher _publisher;

    public PublishResultsCommandHandler(IFamsDbContext db, IPublisher publisher)
    {
        _db = db;
        _publisher = publisher;
    }

    public async Task<Result<int>> Handle(PublishResultsCommand request, CancellationToken cancellationToken)
    {
        var results = await _db.Results
            .Where(r => r.SubjectId == request.SubjectId
                     && r.ExamType == request.ExamType
                     && r.TermName == request.TermName
                     && !r.IsPublished)
            .ToListAsync(cancellationToken);

        if (results.Count == 0)
            return Result<int>.Failure("No unpublished results match the supplied subject/exam/term.");

        foreach (var r in results) r.Publish();
        await _db.SaveChangesAsync(cancellationToken);

        // FR-RES-10 — fan-out notifications to student / parent via SMS + email channels.
        var studentIds = results.Select(r => r.StudentId).Distinct().ToList();
        var notifyTargets = await _db.Students.AsNoTracking()
            .Where(s => studentIds.Contains(s.Id))
            .Select(s => new
            {
                s.Id, s.FirstName, s.LastName, s.CampusId,
                ParentPhone = s.Parent != null ? s.Parent.Phone : null,
                ParentEmail = s.Parent != null ? s.Parent.Email : null,
            })
            .ToListAsync(cancellationToken);

        foreach (var t in notifyTargets)
        {
            await _publisher.Publish(new ResultPublishedEvent(
                t.Id, t.FirstName, t.LastName, request.TermName, request.ExamType,
                t.ParentPhone, t.ParentEmail, t.CampusId), cancellationToken);
        }

        return Result<int>.Success(results.Count);
    }
}
