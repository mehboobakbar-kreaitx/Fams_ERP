namespace FAMS.Application.Modules.CRM.Queries.GetStudentDocuments;

public record StudentDocumentDto(
    Guid Id,
    string FileName,
    string DocumentType,
    DateTime UploadedAt,
    long SizeBytes,
    string DownloadUrl);
