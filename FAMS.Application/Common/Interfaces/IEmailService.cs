namespace FAMS.Application.Common.Interfaces;

public interface IEmailService
{
    Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default);
    Task SendBulkAsync(IEnumerable<string> recipients, string subject, string htmlBody, CancellationToken ct = default);
}
