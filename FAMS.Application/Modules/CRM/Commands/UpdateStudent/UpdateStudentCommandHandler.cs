using FAMS.Application.Common.Exceptions;
using FAMS.Application.Common.Interfaces;
using FAMS.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Result = FAMS.Application.Common.Models.Result;

namespace FAMS.Application.Modules.CRM.Commands.UpdateStudent;

public class UpdateStudentCommandHandler : IRequestHandler<UpdateStudentCommand, Result>
{
    private readonly IFamsDbContext _db;

    public UpdateStudentCommandHandler(IFamsDbContext db) => _db = db;

    public async Task<Result> Handle(UpdateStudentCommand request, CancellationToken cancellationToken)
    {
        var student = await _db.Students.FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Student), request.Id);

        student.UpdateDetails(
            request.FirstName, request.LastName, request.Address, request.Phone, request.Email,
            request.EmergencyContactName, request.EmergencyContactPhone,
            request.MedicalNotes, request.BloodGroup);

        await _db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
