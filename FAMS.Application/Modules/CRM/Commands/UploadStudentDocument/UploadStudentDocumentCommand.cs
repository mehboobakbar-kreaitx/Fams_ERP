using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.CRM.Commands.UploadStudentDocument;

public class UploadStudentDocumentCommand : IRequest<Result<Guid>>
{
    public Guid StudentId { get; init; }
    public string DocumentType { get; init; } = string.Empty;
    public string FileName { get; init; } = string.Empty;
    public string? ContentType { get; init; }
    public long FileSize { get; init; }
    public Stream Content { get; init; } = Stream.Null;
}
