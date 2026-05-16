using FAMS.Domain.Common;

namespace FAMS.Domain.Entities;

public class StudentDocument : BaseAuditableEntity
{
    public Guid StudentId { get; private set; }
    public string DocumentType { get; private set; } = string.Empty;
    public string FileName { get; private set; } = string.Empty;
    public string StorageKey { get; private set; } = string.Empty;
    public long FileSizeBytes { get; private set; }
    public string? ContentType { get; private set; }

    public Student Student { get; private set; } = null!;

    private StudentDocument() { }

    public static StudentDocument Create(Guid studentId, string documentType, string fileName, string storageKey, long fileSize, string? contentType)
        => new()
        {
            StudentId = studentId,
            DocumentType = documentType,
            FileName = fileName,
            StorageKey = storageKey,
            FileSizeBytes = fileSize,
            ContentType = contentType,
        };
}
