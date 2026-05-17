using System.Data.Common;
using FAMS.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FAMS.Infrastructure.Persistence;

/// <summary>
/// Sets PostgreSQL session variables <c>app.campus_id</c> and <c>app.cross_campus_access</c>
/// from the current authenticated user's JWT claims so the Row Level Security policies in
/// the database (PRD §9.4 / NFR-08) can scope tenant-owned rows correctly.
/// </summary>
public class RlsConnectionInterceptor : DbConnectionInterceptor
{
    private readonly IServiceProvider _services;
    private readonly ILogger<RlsConnectionInterceptor> _logger;

    public RlsConnectionInterceptor(IServiceProvider services, ILogger<RlsConnectionInterceptor> logger)
    {
        _services = services;
        _logger = logger;
    }

    public override async Task ConnectionOpenedAsync(DbConnection connection, ConnectionEndEventData eventData,
        CancellationToken cancellationToken = default)
    {
        try
        {
            using var scope = _services.CreateScope();
            var currentUser = scope.ServiceProvider.GetService<ICurrentUserService>();

            string campusValue;
            string crossCampus;

            if (currentUser is null || !currentUser.IsAuthenticated)
            {
                // Startup / background jobs / Hangfire — grant cross-campus so seeders & jobs work.
                campusValue = string.Empty;
                crossCampus = "true";
            }
            else if (currentUser.Roles?.Contains("SystemAdmin") == true || currentUser.Roles?.Contains("Executive") == true)
            {
                // System Admin and Executive Board need cross-campus visibility per PRD §6.
                campusValue = string.Empty;
                crossCampus = "true";
            }
            else
            {
                campusValue = currentUser.CampusId?.ToString() ?? string.Empty;
                crossCampus = "false";
            }

            await using var cmd = connection.CreateCommand();
            cmd.CommandText = "SELECT set_config('app.campus_id', @cid, false), set_config('app.cross_campus_access', @x, false)";
            var pCid = cmd.CreateParameter(); pCid.ParameterName = "@cid"; pCid.Value = campusValue; cmd.Parameters.Add(pCid);
            var pX = cmd.CreateParameter(); pX.ParameterName = "@x"; pX.Value = crossCampus; cmd.Parameters.Add(pX);
            await cmd.ExecuteNonQueryAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            // Never continue with a connection whose tenant scope could not be set —
            // a silent fallback here risks leaking cross-campus data to the wrong user.
            _logger.LogError(ex, "Failed to apply RLS session variables. Aborting to prevent data leak.");
            throw;
        }
    }
}
