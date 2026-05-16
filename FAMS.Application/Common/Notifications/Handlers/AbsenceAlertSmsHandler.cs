using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Notifications.Events;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FAMS.Application.Common.Notifications.Handlers;

public class AbsenceAlertSmsHandler : INotificationHandler<StudentMarkedAbsentEvent>
{
    private readonly ISmsService _sms;
    private readonly ILogger<AbsenceAlertSmsHandler> _logger;

    public AbsenceAlertSmsHandler(ISmsService sms, ILogger<AbsenceAlertSmsHandler> logger)
    {
        _sms = sms;
        _logger = logger;
    }

    public async Task Handle(StudentMarkedAbsentEvent e, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(e.ParentPhone)) return;

        try
        {
            await _sms.SendAsync(
                e.ParentPhone,
                $"FAMS: {e.StudentFirstName} {e.StudentLastName} was marked absent on {e.Date:yyyy-MM-dd}. " +
                "Please contact the school for details.",
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Absence SMS failed for student {StudentId}", e.StudentId);
        }
    }
}
