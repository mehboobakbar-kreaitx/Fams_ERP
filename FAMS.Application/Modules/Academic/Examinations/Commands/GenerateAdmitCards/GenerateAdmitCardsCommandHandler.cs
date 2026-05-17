using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace FAMS.Application.Modules.Academic.Examinations.Commands.GenerateAdmitCards;

public class GenerateAdmitCardsCommandHandler
    : IRequestHandler<GenerateAdmitCardsCommand, Result<GenerateAdmitCardsResult>>
{
    private readonly IFamsDbContext _db;
    private readonly IPdfService _pdf;
    private readonly IStorageService _storage;
    private readonly IConfiguration _config;
    private readonly ILogger<GenerateAdmitCardsCommandHandler> _logger;

    public GenerateAdmitCardsCommandHandler(
        IFamsDbContext db, IPdfService pdf, IStorageService storage,
        IConfiguration config, ILogger<GenerateAdmitCardsCommandHandler> logger)
    {
        _db = db;
        _pdf = pdf;
        _storage = storage;
        _config = config;
        _logger = logger;
    }

    public async Task<Result<GenerateAdmitCardsResult>> Handle(
        GenerateAdmitCardsCommand request, CancellationToken cancellationToken)
    {
        var exam = await _db.Exams.AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == request.ExamId, cancellationToken);
        if (exam is null)
            return Result<GenerateAdmitCardsResult>.Failure($"Exam '{request.ExamId}' not found.");

        var studentQuery = _db.Students.AsNoTracking()
            .Where(s => s.ClassId == exam.ClassId);
        if (request.SectionId.HasValue)
            studentQuery = studentQuery.Where(s => s.SectionId == request.SectionId.Value);

        var students = await studentQuery
            .Select(s => new { s.Id, s.FirstName, s.LastName, s.RollNumber })
            .ToListAsync(cancellationToken);

        if (students.Count == 0)
            return Result<GenerateAdmitCardsResult>.Failure("No students found for this exam's class.");

        // ── Attendance eligibility filter ─────────────────────────────────────
        int ineligibleSkipped = 0;
        if (request.AttendanceThresholdPercent > 0m)
        {
            var studentIdList = students.Select(s => s.Id).ToList();
            var attendanceCounts = await _db.Attendances
                .Where(a => a.StudentId != null && studentIdList.Contains(a.StudentId.Value))
                .GroupBy(a => a.StudentId!.Value)
                .Select(g => new
                {
                    StudentId = g.Key,
                    Total = g.Count(),
                    Present = g.Count(a => a.IsPresent)
                })
                .ToListAsync(cancellationToken);

            var countMap = attendanceCounts.ToDictionary(c => c.StudentId);
            var eligible = students.Where(s =>
            {
                if (!countMap.TryGetValue(s.Id, out var counts)) return false;
                var pct = counts.Total == 0 ? 0m : (decimal)counts.Present / counts.Total * 100m;
                return pct >= request.AttendanceThresholdPercent;
            }).ToList();

            ineligibleSkipped = students.Count - eligible.Count;
            if (ineligibleSkipped > 0)
                _logger.LogInformation(
                    "Admit card generation for exam {ExamId}: {Count} student(s) skipped due to attendance below {Threshold}%",
                    exam.Id, ineligibleSkipped, request.AttendanceThresholdPercent);

            students = eligible;
        }

        var bucket = _config["Minio:BucketExports"] ?? "fams-exports";
        var cards = new List<AdmitCardEntry>(students.Count);

        foreach (var s in students)
        {
            try
            {
                var pdfBytes = await _pdf.GenerateAdmitCardAsync(s.Id, exam.Id, cancellationToken);
                var key = $"admit-cards/{exam.Id}/{s.Id}.pdf";
                using var ms = new MemoryStream(pdfBytes);
                await _storage.UploadAsync(ms, key, bucket, cancellationToken);
                var url = await _storage.GetPresignedUrlAsync(key, bucket, expiryMinutes: 1440);
                cards.Add(new AdmitCardEntry(s.Id, $"{s.FirstName} {s.LastName}", s.RollNumber, url));
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to generate admit card for student {StudentId}", s.Id);
            }
        }

        return Result<GenerateAdmitCardsResult>.Success(
            new GenerateAdmitCardsResult(exam.Id, cards.Count, ineligibleSkipped, cards));
    }
}
