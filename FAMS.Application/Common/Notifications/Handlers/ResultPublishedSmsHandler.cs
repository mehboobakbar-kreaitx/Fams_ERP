using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Notifications.Events;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FAMS.Application.Common.Notifications.Handlers;

public class ResultPublishedSmsHandler : INotificationHandler<ResultPublishedEvent>
{
    private readonly ISmsService _sms;
    private readonly IEmailService _email;
    private readonly ILogger<ResultPublishedSmsHandler> _logger;

    public ResultPublishedSmsHandler(ISmsService sms, IEmailService email, ILogger<ResultPublishedSmsHandler> logger)
    {
        _sms = sms;
        _email = email;
        _logger = logger;
    }

    public async Task Handle(ResultPublishedEvent e, CancellationToken cancellationToken)
    {
        var msg = $"FAMS: {e.StudentFirstName}'s {e.ExamType} results for {e.TermName} have been published. " +
                  "Log in to the student portal to view the grade card.";

        if (!string.IsNullOrWhiteSpace(e.ParentPhone))
        {
            try { await _sms.SendAsync(e.ParentPhone, msg, cancellationToken); }
            catch (Exception ex) { _logger.LogWarning(ex, "Result-published SMS failed for {StudentId}", e.StudentId); }
        }

        if (!string.IsNullOrWhiteSpace(e.ParentEmail))
        {
            try { await _email.SendAsync(e.ParentEmail, $"FAMS — Results published for {e.StudentFirstName}", $"<p>{msg}</p>", cancellationToken); }
            catch (Exception ex) { _logger.LogWarning(ex, "Result-published email failed for {StudentId}", e.StudentId); }
        }
    }
}
