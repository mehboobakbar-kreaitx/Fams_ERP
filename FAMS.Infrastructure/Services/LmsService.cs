using FAMS.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace FAMS.Infrastructure.Services;

/// <summary>
/// Stub LMS bridge — replace with real Moodle/Canvas REST calls.
/// Configured via LMS:Provider, LMS:BaseUrl, LMS:ApiToken in appsettings.
/// </summary>
public class LmsService : ILmsService
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly ILogger<LmsService> _logger;
    private static DateTime? _lastSync;

    public LmsService(IHttpClientFactory httpFactory, IConfiguration config, ILogger<LmsService> logger)
    {
        _http = httpFactory.CreateClient("LMS");
        _config = config;
        _logger = logger;
    }

    public async Task<LmsSyncResult> SyncCampusAsync(Guid campusId, CancellationToken ct = default)
    {
        var provider = _config["LMS:Provider"] ?? "stub";
        _logger.LogInformation("LMS sync started for campus {CampusId} via provider {Provider}", campusId, provider);

        // Stub: real impl would POST to LMS REST API and map courses/enrolments
        await Task.Delay(50, ct);

        _lastSync = DateTime.UtcNow;
        _logger.LogInformation("LMS sync completed for campus {CampusId}", campusId);

        return new LmsSyncResult(CoursesUpserted: 0, EnrolmentsUpserted: 0,
            Warnings: ["LMS integration is in stub mode. Configure LMS:BaseUrl and LMS:ApiToken to activate."]);
    }

    public Task<LmsStatus> GetStatusAsync(CancellationToken ct = default)
    {
        var provider = _config["LMS:Provider"] ?? "stub";
        var baseUrl = _config["LMS:BaseUrl"];
        var connected = !string.IsNullOrWhiteSpace(baseUrl);

        return Task.FromResult(new LmsStatus(connected, provider, _lastSync));
    }
}
