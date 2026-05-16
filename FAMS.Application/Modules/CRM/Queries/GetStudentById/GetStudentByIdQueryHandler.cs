using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using FAMS.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FAMS.Application.Modules.CRM.Queries.GetStudentById;

public class GetStudentByIdQueryHandler : IRequestHandler<GetStudentByIdQuery, Result<StudentDetailDto>>
{
    private readonly IFamsDbContext _db;

    public GetStudentByIdQueryHandler(IFamsDbContext db) => _db = db;

    public async Task<Result<StudentDetailDto>> Handle(GetStudentByIdQuery request, CancellationToken cancellationToken)
    {
        var student = await _db.Students
            .AsNoTracking()
            .Include(s => s.Campus)
            .Include(s => s.Parent)
            .FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);

        if (student is null)
            return Result<StudentDetailDto>.Failure($"Student {request.Id} not found.");

        var outstanding = await _db.FeeInvoices
            .Where(i => i.StudentId == student.Id && i.Status != PaymentStatus.Paid && i.Status != PaymentStatus.Waived)
            .SumAsync(i => i.TotalAmount + i.LateFee - i.Discount - i.PaidAmount, cancellationToken);

        var attendanceRecords = await _db.Attendances
            .Where(a => a.StudentId == student.Id)
            .Select(a => a.IsPresent)
            .ToListAsync(cancellationToken);

        var attendancePct = attendanceRecords.Count == 0
            ? 0m
            : Math.Round((decimal)attendanceRecords.Count(p => p) / attendanceRecords.Count * 100m, 2);

        var dto = new StudentDetailDto(
            student.Id, student.FirstName, student.LastName, student.FatherName,
            student.DateOfBirth, student.Gender, student.NIC, student.BForm,
            student.Address, student.Phone, student.Email, student.RollNumber, student.Status,
            student.EmergencyContactName, student.EmergencyContactPhone,
            student.MedicalNotes, student.BloodGroup, student.Photo, student.EnrollmentDate,
            student.Parent is null ? null : $"{student.Parent.FirstName} {student.Parent.LastName}",
            student.Parent?.Phone,
            student.Campus.Name,
            outstanding,
            attendancePct);

        return Result<StudentDetailDto>.Success(dto);
    }
}
