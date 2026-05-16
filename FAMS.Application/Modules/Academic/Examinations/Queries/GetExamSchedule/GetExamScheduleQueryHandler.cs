using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.Academic.Examinations.Queries.GetExamSchedule;

public class GetExamScheduleQueryHandler : IRequestHandler<GetExamScheduleQuery, Result<ExamScheduleDto>>
{
    private readonly IFamsDbContext _db;

    public GetExamScheduleQueryHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<ExamScheduleDto>> Handle(GetExamScheduleQuery request, CancellationToken cancellationToken)
    {
        var exam = await _db.Exams.AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == request.ExamId, cancellationToken);
        if (exam is null)
            return Result<ExamScheduleDto>.Failure($"Exam '{request.ExamId}' not found.");

        var items = await _db.ExamScheduleItems.AsNoTracking()
            .Where(i => i.ExamId == request.ExamId)
            .Join(_db.Subjects, i => i.SubjectId, s => s.Id,
                (i, s) => new ExamScheduleItemDto(
                    i.Id, i.SubjectId, s.Name, s.Code,
                    i.ExamDate, i.StartTime, i.EndTime, i.TotalMarks, i.Hall))
            .OrderBy(d => d.ExamDate).ThenBy(d => d.StartTime)
            .ToListAsync(cancellationToken);

        var dto = new ExamScheduleDto(
            exam.Id, exam.Name, exam.ExamType, exam.TermName,
            exam.ClassId, exam.StartDate, exam.EndDate, exam.IsPublished, items);

        return Result<ExamScheduleDto>.Success(dto);
    }
}
