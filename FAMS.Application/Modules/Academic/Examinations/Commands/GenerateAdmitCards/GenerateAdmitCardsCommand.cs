using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Academic.Examinations.Commands.GenerateAdmitCards;

public record AdmitCardEntry(Guid StudentId, string StudentName, string RollNumber, string Url);

public record GenerateAdmitCardsResult(
    Guid ExamId,
    int Generated,
    int IneligibleSkipped,
    IReadOnlyList<AdmitCardEntry> Cards);

public record GenerateAdmitCardsCommand(
    Guid ExamId,
    Guid? SectionId = null,
    decimal AttendanceThresholdPercent = 75m) : IRequest<Result<GenerateAdmitCardsResult>>;
