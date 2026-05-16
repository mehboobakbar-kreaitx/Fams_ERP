using FAMS.Application.Common.Exceptions;
using FAMS.Application.Common.Interfaces;
using FAMS.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Result = FAMS.Application.Common.Models.Result;

namespace FAMS.Application.Modules.CRM.Commands.DeleteStudent;

public class DeleteStudentCommandHandler : IRequestHandler<DeleteStudentCommand, Result>
{
    private readonly IFamsDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public DeleteStudentCommandHandler(IFamsDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<Result> Handle(DeleteStudentCommand request, CancellationToken cancellationToken)
    {
        var student = await _db.Students.FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Student), request.Id);

        student.IsDeleted = true;
        student.DeletedAt = DateTime.UtcNow;
        student.DeletedBy = _currentUser.UserId ?? "system";

        await _db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
