using FAMS.Application.Common.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;

namespace FAMS.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default)
    {
        var host = _config["Smtp:Host"];
        var username = _config["Smtp:Username"];
        var password = _config["Smtp:Password"];
        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
        {
            _logger.LogWarning("SMTP not configured — skipping email to {Recipient}: {Subject}", to, subject);
            return;
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_config["Smtp:FromName"] ?? "FAMS", username));
        message.To.Add(MailboxAddress.Parse(to));
        message.Subject = subject;
        message.Body = new TextPart("html") { Text = htmlBody };

        using var client = new SmtpClient();
        await client.ConnectAsync(host, int.Parse(_config["Smtp:Port"] ?? "587"), SecureSocketOptions.StartTls, ct);
        await client.AuthenticateAsync(username, password, ct);
        await client.SendAsync(message, ct);
        await client.DisconnectAsync(true, ct);

        _logger.LogInformation("Email sent to {Recipient}: {Subject}", to, subject);
    }

    public async Task SendBulkAsync(IEnumerable<string> recipients, string subject, string htmlBody, CancellationToken ct = default)
    {
        foreach (var recipient in recipients)
        {
            try { await SendAsync(recipient, subject, htmlBody, ct); }
            catch (Exception ex) { _logger.LogError(ex, "Failed to send bulk email to {Recipient}", recipient); }
        }
    }
}
