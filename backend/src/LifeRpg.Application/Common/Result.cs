namespace LifeRpg.Application.Common;

public enum ErrorType
{
    None,
    Validation,
    NotFound,
    Conflict,
    Unauthorized,
    Forbidden,
}

/// <summary>Outcome of a service operation, mapped to HTTP status codes by the API layer.</summary>
public class Result
{
    public bool Succeeded { get; init; }
    public ErrorType ErrorType { get; init; }
    public string? Error { get; init; }

    public static Result Success() => new() { Succeeded = true };
    public static Result Failure(ErrorType type, string error) =>
        new() { Succeeded = false, ErrorType = type, Error = error };

    public static Result NotFound(string error = "Not found") => Failure(ErrorType.NotFound, error);
    public static Result Conflict(string error) => Failure(ErrorType.Conflict, error);
    public static Result Validation(string error) => Failure(ErrorType.Validation, error);
    public static Result Unauthorized(string error = "Unauthorized") => Failure(ErrorType.Unauthorized, error);
}

public class Result<T> : Result
{
    public T? Value { get; init; }

    public static Result<T> Success(T value) => new() { Succeeded = true, Value = value };
    public static new Result<T> Failure(ErrorType type, string error) =>
        new() { Succeeded = false, ErrorType = type, Error = error };

    public static new Result<T> NotFound(string error = "Not found") => Failure(ErrorType.NotFound, error);
    public static new Result<T> Conflict(string error) => Failure(ErrorType.Conflict, error);
    public static new Result<T> Validation(string error) => Failure(ErrorType.Validation, error);
    public static new Result<T> Unauthorized(string error = "Unauthorized") => Failure(ErrorType.Unauthorized, error);
}
