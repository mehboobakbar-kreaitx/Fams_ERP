using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ExamEntity = FAMS.Domain.Entities.Exam;
using ExamScheduleItemEntity = FAMS.Domain.Entities.ExamScheduleItem;

namespace FAMS.Application.Modules.Academic.Examinations.Commands.CreateExamSchedule;

public class CreateExamScheduleCommandHandler : IRequestHandler<CreateExamScheduleCommand, Result<Guid>>
{
    private readonly IFamsDbContext _db;

    public CreateExamScheduleCommandHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<Guid>> Handle(CreateExamScheduleCommand request, CancellationToken cancellationToken)
    {
        var classExists = await _db.ClassRooms.AnyAsync(c => c.Id == request.ClassId, cancellationToken);
        if (!classExists)
            return Result<Guid>.Failure($"Class '{request.ClassId}' not found.");

        var duplicate = await _db.Exams.AnyAsync(
            e => e.ClassId == request.ClassId
              && e.TermName == request.TermName
              && e.ExamType == request.ExamType, cancellationToken);
        if (duplicate)
            return Result<Guid>.Failure($"An exam of type '{request.ExamType}' for term '{request.TermName}' already exists for this class.");

        var exam = ExamEntity.Create(request.Name, request.ExamType, request.TermName,
            request.ClassId, request.StartDate, request.EndDate);

        _db.Exams.Add(exam);
        await _db.SaveChangesAsync(cancellationToken);

        foreach (var item in request.Items)
        {
            var entity = ExamScheduleItemEntity.Create(exam.Id, item.SubjectId, item.ExamDate,
                item.StartTime, item.EndTime, item.TotalMarks, item.Hall);
            entity.CampusId = exam.CampusId;
            _db.ExamScheduleItems.Add(entity);
        }

        await _db.SaveChangesAsync(cancellationToken);
        return Result<Guid>.Success(exam.Id);
    }
}
