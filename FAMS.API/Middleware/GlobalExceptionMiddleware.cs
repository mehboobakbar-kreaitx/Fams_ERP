using System.Net;
using System.Text.Json;
using FAMS.Application.Common.Exceptions;

namespace FAMS.API.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger, IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleAsync(context, ex);
        }
    }

    private async Task HandleAsync(HttpContext context, Exception ex)
    {
        // Client closed the connection before the response was sent. This is
        // normal (navigation, tab close, timeout on the client side) and must
        // not be logged as a server error or written back as a response — the
        // socket is already closed.
        if (ex is OperationCanceledException or TaskCanceledException
            && context.RequestAborted.IsCancellationRequested)
        {
            _logger.LogDebug("Request cancelled by client: {Method} {Path}", context.Request.Method, context.Request.Path);
            return;
        }

        var traceId = context.TraceIdentifier;

        var (status, payload) = ex switch
        {
            ValidationException v => (HttpStatusCode.BadRequest, (object)new
            {
                type = "validation_error",
                title = "Validation failed",
                status = 400,
                errors = v.Errors,
                traceId,
            }),
            NotFoundException n => (HttpStatusCode.NotFound, new
            {
                type = "not_found",
                title = "Resource not found",
                status = 404,
                detail = n.Message,
                traceId,
            }),
            UnauthorizedException u => (HttpStatusCode.Unauthorized, new
            {
                type = "unauthorized",
                title = "Unauthorized",
                status = 401,
                detail = u.Message,
                traceId,
            }),
            UnauthorizedAccessException u => (HttpStatusCode.Forbidden, new
            {
                type = "forbidden",
                title = "Forbidden",
                status = 403,
                detail = u.Message,
                traceId,
            }),
            _ => (HttpStatusCode.InternalServerError, new
            {
                type = "internal_error",
                title = "An unexpected error occurred",
                status = 500,
                detail = _env.IsDevelopment() ? ex.ToString() : "Please contact support.",
                traceId,
            }),
        };

        if ((int)status >= 500)
            _logger.LogError(ex, "Unhandled exception [{TraceId}] {Method} {Path}", traceId, context.Request.Method, context.Request.Path);
        else
            _logger.LogWarning(ex, "Handled {Status} [{TraceId}] {Method} {Path}", (int)status, traceId, context.Request.Method, context.Request.Path);

        context.Response.Headers["X-Request-Id"] = traceId;
        context.Response.StatusCode = (int)status;
        context.Response.ContentType = "application/problem+json";
        await context.Response.WriteAsync(JsonSerializer.Serialize(payload, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        }));
    }
}
