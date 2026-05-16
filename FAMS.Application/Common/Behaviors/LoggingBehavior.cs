using System.Diagnostics;
using FAMS.Application.Common.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FAMS.Application.Common.Behaviors;

public class LoggingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly ILogger<LoggingBehavior<TRequest, TResponse>> _logger;
    private readonly ICurrentUserService _currentUser;

    public LoggingBehavior(ILogger<LoggingBehavior<TRequest, TResponse>> logger, ICurrentUserService currentUser)
    {
        _logger = logger;
        _currentUser = currentUser;
    }

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;
        var userId = _currentUser.UserId ?? "anonymous";
        var campusId = _currentUser.CampusId?.ToString() ?? "none";

        _logger.LogInformation("FAMS Request: {Name} | User: {UserId} | Campus: {CampusId}",
            requestName, userId, campusId);

        var stopwatch = Stopwatch.StartNew();
        var response = await next();
        stopwatch.Stop();

        var elapsedMs = stopwatch.ElapsedMilliseconds;
        if (elapsedMs > 500)
            _logger.LogWarning("FAMS Slow Request: {Name} took {Elapsed}ms", requestName, elapsedMs);
        else
            _logger.LogInformation("FAMS Response: {Name} completed in {Elapsed}ms", requestName, elapsedMs);

        return response;
    }
}
