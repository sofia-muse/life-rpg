namespace LifeRpg.Domain.GameEngine;

/// <summary>Calendar dates in the hero's IANA time zone. Invalid zones fall back to UTC.</summary>
public static class HeroCalendar
{
    public static DateOnly Today(string? timeZoneId, DateTimeOffset utcNow) =>
        DateInTimeZone(utcNow, timeZoneId);

    public static DateOnly DateInTimeZone(DateTimeOffset instant, string? timeZoneId)
    {
        var utc = DateTime.SpecifyKind(instant.UtcDateTime, DateTimeKind.Utc);
        if (string.IsNullOrWhiteSpace(timeZoneId)
            || timeZoneId.Equals("UTC", StringComparison.OrdinalIgnoreCase))
        {
            return DateOnly.FromDateTime(utc);
        }

        try
        {
            var zone = TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
            var local = TimeZoneInfo.ConvertTimeFromUtc(utc, zone);
            return DateOnly.FromDateTime(local);
        }
        catch (TimeZoneNotFoundException)
        {
            return DateOnly.FromDateTime(utc);
        }
        catch (InvalidTimeZoneException)
        {
            return DateOnly.FromDateTime(utc);
        }
    }
}
