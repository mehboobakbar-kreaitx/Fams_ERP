using FAMS.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Twilio;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;

namespace FAMS.Infrastructure.Services;

public class SmsService : ISmsService
{
    private readonly IConfiguration _config;
    private readonly ILogger<SmsService> _logger;
    private readonly string _fromNumber;

    public SmsService(IConfiguration config, ILogger<SmsService> logger)
    {
        _config = config;
        _logger = logger;
        var sid = _config["Twilio:AccountSid"];
        var token = _config["Twilio:AuthToken"];
        _fromNumber = _config["Twilio:FromNumber"] ?? string.Empty;
        if (!string.IsNullOrWhiteSpace(sid) && !string.IsNullOrWhiteSpace(token))
            TwilioClient.Init(sid, token);
    }

    public async Task SendAsync(string phoneNumber, string message, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_fromNumber))
        {
            _logger.LogWarning("Twilio not configured; SMS skipped for {Phone}", phoneNumber);
            return;
        }

        await MessageResource.CreateAsync(
            body: message,
            from: new PhoneNumber(_fromNumber),
            to: new PhoneNumber(phoneNumber));

        _logger.LogInformation("SMS sent to {Phone}", phoneNumber);
    }

    public async Task SendBulkAsync(IEnumerable<string> phoneNumbers, string message, CancellationToken ct = default)
    {
        foreach (var number in phoneNumbers)
        {
            try { await SendAsync(number, message, ct); }
            catch (Exception ex) { _logger.LogError(ex, "Bulk SMS failed for {Phone}", number); }
        }
    }
}
