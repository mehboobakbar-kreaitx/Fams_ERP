using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using FAMS.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.CRM.Commands.UploadStudentDocument;

public class UploadStudentDocumentCommandHandler
    : IRequestHandler<UploadStudentDocumentCommand, Result<Guid>>
{
    private readonly IFamsDbContext _db;
    private readonly IStorageService _storage;
    private const string Bucket = "fams-documents";

    public UploadStudentDocumentCommandHandler(IFamsDbContext db, IStorageService storage)
    {
        _db = db;
        _storage = storage;
    }

    public async Task<Result<Guid>> Handle(
        UploadStudentDocumentCommand request, CancellationToken cancellationToken)
    {
        var studentExists = await _db.Students
            .AnyAsync(s => s.Id == request.StudentId && !s.IsDeleted, cancellationToken);

        if (!studentExists)
            return Result<Guid>.Failure("Student not found.");

        var storageKey = $"students/{request.StudentId}/{Guid.NewGuid()}_{request.FileName}";

        await _storage.UploadAsync(request.Content, storageKey, Bucket, cancellationToken);

        var doc = StudentDocument.Create(
            request.StudentId,
            request.DocumentType,
            request.FileName,
            storageKey,
            request.FileSize,
            request.ContentType);

        _db.StudentDocuments.Add(doc);
        await _db.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(doc.Id);
    }
}
