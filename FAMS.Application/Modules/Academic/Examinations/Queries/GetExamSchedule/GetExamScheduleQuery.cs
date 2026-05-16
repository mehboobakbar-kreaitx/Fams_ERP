using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Academic.Examinations.Queries.GetExamSchedule;

public record GetExamScheduleQuery(Guid ExamId) : IRequest<Result<ExamScheduleDto>>;
