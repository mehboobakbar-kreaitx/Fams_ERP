using Hangfire;
using Microsoft.Extensions.Logging;

namespace FAMS.Infrastructure.Jobs;

public class HangfireJobService
{
    private readonly ILogger<HangfireJobService> _logger;

    public HangfireJobService(ILogger<HangfireJobService> logger)
    {
        _logger = logger;
    }

    [AutomaticRetry(Attempts = 3)]
    public async Task SendFeeRemindersAsync(Guid campusId)
    {
        _logger.LogInformation("Running fee reminders for campus {CampusId}", campusId);
        await Task.CompletedTask;
    }

    [AutomaticRetry(Attempts = 3)]
    public async Task GenerateMonthlyReportAsync(Guid campusId, int month, int year)
    {
        _logger.LogInformation("Generating monthly report for campus {CampusId} {Month}/{Year}", campusId, month, year);
        await Task.CompletedTask;
    }

    [AutomaticRetry(Attempts = 2)]
    public async Task SyncAttendanceAsync()
    {
        _logger.LogInformation("Running attendance sync job");
        await Task.CompletedTask;
    }
}
