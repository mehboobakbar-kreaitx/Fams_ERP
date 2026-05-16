using FAMS.Application.Common.Exceptions;
using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Security;
using MediatR;

namespace FAMS.Application.Common.Behaviors;

public class AuthorizationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly ICurrentUserService _currentUser;

    public AuthorizationBehavior(ICurrentUserService currentUser)
    {
        _currentUser = currentUser;
    }

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        var authorizeAttributes = request.GetType()
            .GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true)
            .Cast<AuthorizeAttribute>()
            .ToList();

        if (authorizeAttributes.Count == 0)
            return await next();

        if (!_currentUser.IsAuthenticated)
            throw new UnauthorizedException("Authentication is required for this operation.");

        var requiredRoles = authorizeAttributes
            .SelectMany(a => a.Roles?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries) ?? Array.Empty<string>())
            .Distinct()
            .ToList();

        if (requiredRoles.Count > 0)
        {
            var userRoles = _currentUser.Roles.ToList();
            if (!requiredRoles.Any(r => userRoles.Contains(r)))
                throw new UnauthorizedException($"User does not have any of the required roles: {string.Join(", ", requiredRoles)}");
        }

        return await next();
    }
}
