namespace FAMS.Application.Common.Interfaces;

public interface ISmsService
{
    Task SendAsync(string phoneNumber, string message, CancellationToken ct = default);
    Task SendBulkAsync(IEnumerable<string> phoneNumbers, string message, CancellationToken ct = default);
}
