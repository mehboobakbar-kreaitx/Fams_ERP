using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ResultEntity = FAMS.Domain.Entities.Result;

namespace FAMS.Application.Modules.Results.Commands.EnterMarks;

public class EnterMarksCommandHandler : IRequestHandler<EnterMarksCommand, Result<int>>
{
    private readonly IFamsDbContext _db;

    public EnterMarksCommandHandler(IFamsDbContext db) => _db = db;

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

        int saved = 0;
        foreach (var entry in request.Entries)
        {
            var existing = await _db.Results.FirstOrDefaultAsync(
                r => r.StudentId == entry.StudentId
                  && r.SubjectId == request.SubjectId
                  && r.ExamType == request.ExamType
                  && r.TermName == request.TermName, cancellationToken);

            var grade = CalculateGrade(entry.MarksObtained, request.TotalMarks);

            if (existing is null)
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
        return Result<int>.Success(saved);
    }

    private static string CalculateGrade(decimal obtained, decimal total)
    {
        var pct = total == 0 ? 0 : obtained / total * 100m;
        return pct switch
        {
            >= 90 => "A+",
            >= 80 => "A",
            >= 70 => "B",
            >= 60 => "C",
            >= 50 => "D",
            >= 40 => "E",
            _ => "F"
        };
    }
}
