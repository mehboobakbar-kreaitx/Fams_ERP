using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.CRM.Queries.GetStudentDocuments;

public class GetStudentDocumentsQueryHandler
    : IRequestHandler<GetStudentDocumentsQuery, Result<IReadOnlyList<StudentDocumentDto>>>
{
    private readonly IFamsDbContext _db;
    private readonly IStorageService _storage;
    private const string Bucket = "fams-documents";

    public GetStudentDocumentsQueryHandler(IFamsDbContext db, IStorageService storage)
    {
        _db = db;
        _storage = storage;
    }

    public async Task<Result<IReadOnlyList<StudentDocumentDto>>> Handle(
        GetStudentDocumentsQuery request, CancellationToken cancellationToken)
    {
        var docs = await _db.StudentDocuments
            .AsNoTracking()
            .Where(d => d.StudentId == request.StudentId && !d.IsDeleted)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync(cancellationToken);

        var result = new List<StudentDocumentDto>(docs.Count);
        foreach (var doc in docs)
        {
            var url = await _storage.GetPresignedUrlAsync(doc.StorageKey, Bucket);
            result.Add(new StudentDocumentDto(
                doc.Id,
                doc.FileName,
                doc.DocumentType,
                doc.CreatedAt,
                doc.FileSizeBytes,
                url));
        }

        return Result<IReadOnlyList<StudentDocumentDto>>.Success(result);
    }
}
