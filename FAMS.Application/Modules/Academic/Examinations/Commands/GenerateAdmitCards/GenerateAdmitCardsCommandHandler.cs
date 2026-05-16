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
            new GenerateAdmitCardsResult(exam.Id, cards.Count, cards));
    }
}
