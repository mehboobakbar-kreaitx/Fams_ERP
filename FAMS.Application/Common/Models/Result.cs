namespace FAMS.Application.Common.Models;

public class Result
{
    public bool IsSuccess { get; protected set; }
    public string? Error { get; protected set; }
    public List<string> ValidationErrors { get; protected set; } = new();

    protected Result() { }

    public static Result Success() => new() { IsSuccess = true };
    public static Result Failure(string error) => new() { IsSuccess = false, Error = error };
    public static Result ValidationFailure(List<string> errors) => new()
    {
        IsSuccess = false,
        ValidationErrors = errors,
        Error = "One or more validation errors occurred."
    };
}

public class Result<T> : Result
{
    public T? Value { get; private set; }

    private Result() { }

    public static Result<T> Success(T value) => new() { IsSuccess = true, Value = value };
    public new static Result<T> Failure(string error) => new() { IsSuccess = false, Error = error };
    public new static Result<T> ValidationFailure(List<string> errors) => new()
    {
        IsSuccess = false,
        ValidationErrors = errors,
        Error = "One or more validation errors occurred."
    };
}
