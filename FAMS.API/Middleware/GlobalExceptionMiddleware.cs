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
        var (status, payload) = ex switch
        {
            ValidationException v => (HttpStatusCode.BadRequest, (object)new
            {
                type = "validation_error",
                title = "Validation failed",
                status = 400,
                errors = v.Errors,
            }),
            NotFoundException n => (HttpStatusCode.NotFound, new
            {
                type = "not_found",
                title = "Resource not found",
                status = 404,
                detail = n.Message,
            }),
            UnauthorizedException u => (HttpStatusCode.Unauthorized, new
            {
                type = "unauthorized",
                title = "Unauthorized",
                status = 401,
                detail = u.Message,
            }),
            UnauthorizedAccessException u => (HttpStatusCode.Forbidden, new
            {
                type = "forbidden",
                title = "Forbidden",
                status = 403,
                detail = u.Message,
            }),
            _ => (HttpStatusCode.InternalServerError, new
            {
                type = "internal_error",
                title = "An unexpected error occurred",
                status = 500,
                detail = _env.IsDevelopment() ? ex.ToString() : "Please contact support.",
            }),
        };

        if ((int)status >= 500)
            _logger.LogError(ex, "Unhandled exception processing {Method} {Path}", context.Request.Method, context.Request.Path);
        else
            _logger.LogWarning(ex, "Handled {Status} for {Method} {Path}", (int)status, context.Request.Method, context.Request.Path);

        context.Response.StatusCode = (int)status;
        context.Response.ContentType = "application/problem+json";
        await context.Response.WriteAsync(JsonSerializer.Serialize(payload, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        }));
    }
}
