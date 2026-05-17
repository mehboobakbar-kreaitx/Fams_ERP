namespace FAMS.Application.Common.Interfaces;

public interface IPdfService
{
    Task<byte[]> GenerateGradeCardAsync(Guid studentId, string termName, string? examType = null, CancellationToken ct = default);
    Task<byte[]> GeneratePayslipAsync(Guid staffId, int month, int year, CancellationToken ct = default);
    Task<byte[]> GenerateFeeReceiptAsync(Guid paymentId, CancellationToken ct = default);
    Task<byte[]> GenerateOfferLetterAsync(Guid applicationId, CancellationToken ct = default);
    Task<byte[]> GenerateAdmitCardAsync(Guid studentId, Guid examScheduleId, CancellationToken ct = default);
}
