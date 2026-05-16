using FAMS.Application.Common.Models;
using FluentValidation;
using MediatR;

namespace FAMS.Application.Common.Behaviors;

public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
    {
        _validators = validators;
    }

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        if (!_validators.Any())
            return await next();

        var context = new ValidationContext<TRequest>(request);
        var validationResults = await Task.WhenAll(
            _validators.Select(v => v.ValidateAsync(context, cancellationToken)));
        var failures = validationResults
            .SelectMany(r => r.Errors)
            .Where(f => f != null)
            .Select(f => f.ErrorMessage)
            .ToList();

        if (failures.Count == 0)
            return await next();

        var responseType = typeof(TResponse);
        if (responseType.IsGenericType && responseType.GetGenericTypeDefinition() == typeof(Result<>))
        {
            var validationFailureMethod = responseType.GetMethod(nameof(Result.ValidationFailure));
            var result = validationFailureMethod!.Invoke(null, new object[] { failures });
            return (TResponse)result!;
        }
        if (responseType == typeof(Result))
        {
            return (TResponse)(object)Result.ValidationFailure(failures);
        }

        throw new Common.Exceptions.ValidationException(validationResults.SelectMany(r => r.Errors));
    }
}
