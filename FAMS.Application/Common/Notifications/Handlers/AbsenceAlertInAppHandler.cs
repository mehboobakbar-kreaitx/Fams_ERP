using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Notifications.Events;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FAMS.Application.Common.Notifications.Handlers;

public class AbsenceAlertInAppHandler : INotificationHandler<StudentMarkedAbsentEvent>
{
    private readonly INotificationHub _hub;
    private readonly ILogger<AbsenceAlertInAppHandler> _logger;

    public AbsenceAlertInAppHandler(INotificationHub hub, ILogger<AbsenceAlertInAppHandler> logger)
    {
        _hub = hub;
        _logger = logger;
    }

    public async Task Handle(StudentMarkedAbsentEvent e, CancellationToken cancellationToken)
    {
        try
        {
            await _hub.SendToCampusAsync(
                e.CampusId,
                "Attendance alert",
                $"{e.StudentFirstName} {e.StudentLastName} was marked absent on {e.Date:yyyy-MM-dd}.",
                ct: cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "In-app absence alert failed for student {StudentId}", e.StudentId);
        }
    }
}
