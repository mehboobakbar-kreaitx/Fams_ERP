using FAMS.Application.Common.Exceptions;
using FAMS.Application.Common.Interfaces;
using FAMS.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Result = FAMS.Application.Common.Models.Result;

namespace FAMS.Application.Modules.CRM.Commands.UpdateStudentStatus;

public class UpdateStudentStatusCommandHandler : IRequestHandler<UpdateStudentStatusCommand, Result>
{
    private readonly IFamsDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public UpdateStudentStatusCommandHandler(IFamsDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<Result> Handle(UpdateStudentStatusCommand request, CancellationToken cancellationToken)
    {
        var student = await _db.Students.FirstOrDefaultAsync(s => s.Id == request.StudentId, cancellationToken)
            ?? throw new NotFoundException(nameof(Student), request.StudentId);

        var previousStatus = student.Status;
        student.ChangeStatus(request.NewStatus);

        _db.AuditLogs.Add(AuditLog.Create(
            entityName: nameof(Student),
            entityId: student.Id.ToString(),
            action: "StatusChange",
            userId: _currentUser.UserId ?? "system",
            userName: _currentUser.UserName ?? "system",
            oldValues: previousStatus.ToString(),
            newValues: $"{request.NewStatus} | Reason: {request.Reason}"));

        await _db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
