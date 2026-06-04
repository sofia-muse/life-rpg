using System.Text.Json;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace LifeRpg.Infrastructure.Persistence;

/// <summary>
/// Helpers to persist a complex value object as a JSON string column (nvarchar(max) on
/// SQL Server). Provider-agnostic — keeps the model portable for SQLite-backed tests while
/// still representing rich value objects (stat XP, appearance, lists) as JSON.
/// </summary>
internal static class JsonValue
{
    private static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web);

    public static ValueConverter<T, string> Converter<T>()
        where T : class, new() =>
        new(
            v => JsonSerializer.Serialize(v, Options),
            v => Deserialize<T>(v));

    public static ValueComparer<T> Comparer<T>()
        where T : class, new() =>
        new(
            (a, b) => JsonSerializer.Serialize(a, Options) == JsonSerializer.Serialize(b, Options),
            v => v == null ? 0 : JsonSerializer.Serialize(v, Options).GetHashCode(),
            v => Deserialize<T>(JsonSerializer.Serialize(v, Options)));

    private static T Deserialize<T>(string v)
        where T : class, new() =>
        string.IsNullOrEmpty(v) ? new T() : JsonSerializer.Deserialize<T>(v, Options) ?? new T();

    public static ValueConverter<List<string>, string> ListConverter() =>
        new(
            v => JsonSerializer.Serialize(v, Options),
            v => string.IsNullOrEmpty(v)
                ? new List<string>()
                : JsonSerializer.Deserialize<List<string>>(v, Options) ?? new List<string>());

    public static ValueComparer<List<string>> ListComparer() =>
        new(
            (a, b) => JsonSerializer.Serialize(a, Options) == JsonSerializer.Serialize(b, Options),
            v => v == null ? 0 : JsonSerializer.Serialize(v, Options).GetHashCode(),
            v => v.ToList());
}
