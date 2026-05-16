using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using FAMS.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.CRM.Commands.CreateStudent;

public class CreateStudentCommandHandler : IRequestHandler<CreateStudentCommand, Result<Guid>>
{
    private readonly IFamsDbContext _db;

    public CreateStudentCommandHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<Guid>> Handle(CreateStudentCommand request, CancellationToken cancellationToken)
    {
        var rollExists = await _db.Students
            .AnyAsync(s => s.CampusId == request.CampusId && s.RollNumber == request.RollNumber, cancellationToken);
        if (rollExists)
            return Result<Guid>.Failure($"Roll number '{request.RollNumber}' already exists in this campus.");

        var student = Student.Create(
            request.FirstName, request.LastName, request.FatherName,
            request.DateOfBirth, request.Gender, request.Address, request.Phone,
            request.ProgramId, request.ClassId, request.SectionId, request.RollNumber,
            request.EmergencyContactName, request.EmergencyContactPhone,
            request.NIC, request.BForm, request.Email, request.BloodGroup);

        student.CampusId = request.CampusId;
        if (request.ParentId.HasValue) student.AssignParent(request.ParentId.Value);

        _db.Students.Add(student);
        await _db.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(student.Id);
    }
}
