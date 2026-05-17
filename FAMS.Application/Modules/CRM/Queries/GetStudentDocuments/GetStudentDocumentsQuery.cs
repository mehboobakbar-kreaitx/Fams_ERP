using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.CRM.Queries.GetStudentDocuments;

public record GetStudentDocumentsQuery(Guid StudentId) : IRequest<Result<IReadOnlyList<StudentDocumentDto>>>;
