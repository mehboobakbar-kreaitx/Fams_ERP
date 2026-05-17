using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using FAMS.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ResultEntity = FAMS.Domain.Entities.Result;

namespace FAMS.Application.Modules.Results.Commands.EnterMarks;

public class EnterMarksCommandHandler : IRequestHandler<EnterMarksCommand, Result<int>>
{
    private readonly IFamsDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public EnterMarksCommandHandler(IFamsDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<Result<int>> Handle(EnterMarksCommand request, CancellationToken cancellationToken)
    {
        var subjectExists = await _db.Subjects.AnyAsync(s => s.Id == request.SubjectId, cancellationToken);
        if (!subjectExists)
            return Result<int>.Failure($"Subject '{request.SubjectId}' not found.");

        var studentIds = request.Entries.Select(e => e.StudentId).Distinct().ToList();
        var existingStudentIds = await _db.Students
            .Where(s => studentIds.Contains(s.Id))
            .Select(s => s.Id)
            .ToListAsync(cancellationToken);

        var missing = studentIds.Except(existingStudentIds).ToList();
        if (missing.Count > 0)
            return Result<int>.Failure($"Unknown student id(s): {string.Join(", ", missing)}.");

        var alreadyPublished = await _db.Results
            .AnyAsync(r => r.SubjectId == request.SubjectId
                        && r.ExamType == request.ExamType
                        && r.TermName == request.TermName
                        && r.IsPublished, cancellationToken);
        if (alreadyPublished)
            return Result<int>.Failure("Results for this subject/exam/term have already been published and cannot be edited.");

        // Load the campus-active grading scale once for the whole batch.
        var activeScaleId = await _db.GradingScales.AsNoTracking()
            .Where(g => g.IsActive && g.ProgramId == null)
            .Select(g => (Guid?)g.Id)
            .FirstOrDefaultAsync(cancellationToken);

        var scaleRules = activeScaleId.HasValue
            ? await _db.GradingScaleRules.AsNoTracking()
                .Where(r => r.GradingScaleId == activeScaleId.Value)
                .OrderByDescending(r => r.MinPercent)
                .ToListAsync(cancellationToken)
            : new List<GradingScaleRule>();

        // Load all existing records for this subject/exam/term in one query (avoids N+1).
        var existingByStudentId = await _db.Results
            .Where(r => r.SubjectId == request.SubjectId
                     && r.ExamType == request.ExamType
                     && r.TermName == request.TermName
                     && studentIds.Contains(r.StudentId))
            .ToDictionaryAsync(r => r.StudentId, cancellationToken);

        int saved = 0, updated = 0;
        foreach (var entry in request.Entries)
        {
            var grade = CalculateGrade(entry.MarksObtained, request.TotalMarks, scaleRules);

            if (existingByStudentId.TryGetValue(entry.StudentId, out var existing))
            {
                var oldSnapshot = $"{existing.MarksObtained}/{existing.TotalMarks} [{existing.Grade}]";
                existing.UpdateMarks(entry.MarksObtained, request.TotalMarks, grade, entry.Remarks);
                _db.AuditLogs.Add(AuditLog.Create(
                    entityName: "Result",
                    entityId: existing.Id.ToString(),
                    action: "MarksUpdated",
                    userId: _currentUser.UserId ?? "system",
                    userName: _currentUser.UserName ?? "system",
                    oldValues: oldSnapshot,
                    newValues: $"{entry.MarksObtained}/{request.TotalMarks} [{grade}]"));
                updated++;
            }
            else
            {
                var entity = ResultEntity.Create(
                    entry.StudentId, request.SubjectId, request.ExamType,
                    entry.MarksObtained, request.TotalMarks, request.TermName,
                    grade, entry.Remarks);
                _db.Results.Add(entity);
                saved++;
            }
        }

        await _db.SaveChangesAsync(cancellationToken);
        return Result<int>.Success(saved + updated);
    }

    // RES-CRIT-01/02: Round first, then evaluate against the configured scale.
    // Falls back to a built-in table only when no grading scale has been saved.
    private static string CalculateGrade(decimal obtained, decimal total, IList<GradingScaleRule> rules)
    {
        var pct = total == 0 ? 0m : Math.Round(obtained / total * 100m, 2);

        if (rules.Count > 0)
        {
            var matched = rules.FirstOrDefault(r => pct >= r.MinPercent && pct <= r.MaxPercent);
            return matched?.Grade ?? "F";
        }

        // Built-in fallback — matches the default rules returned by GetGradingScaleQueryHandler.
        return pct switch
        {
            >= 90 => "A+",
            >= 80 => "A",
            >= 70 => "B",
            >= 60 => "C",
            >= 50 => "D",
            _ => "F"
        };
    }
}
