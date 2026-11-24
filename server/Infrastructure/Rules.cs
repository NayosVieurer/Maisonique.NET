using System.Globalization;
using System.Text.Json;

namespace KitchenTable;

public sealed class Fault(int status, string message) : Exception(message)
{
    public int Status { get; } = status;
    public static Fault Bad(string reason) => new(400, reason);
    public static Fault Conflict(string reason) => new(409, reason);
    public static Fault Missing(string reason) => new(404, reason);
}

public static class Rules
{
    public static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    public static string Id(Guid value) => value.ToString("N");

    public static string Text(string? raw, string what, int max)
    {
        var value = raw?.Trim();
        if (string.IsNullOrEmpty(value) || value.Length > max)
            throw Fault.Bad($"{what} must contain 1 to {max} characters.");
        return value;
    }

    public static int Servings(int value) => value is >= 1 and <= 64
        ? value : throw Fault.Bad("Servings must be a whole number from 1 to 64.");

    public static string? Clock(string? raw)
    {
        if (string.IsNullOrEmpty(raw)) return null;
        if (!TimeOnly.TryParseExact(raw, "HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
            throw Fault.Bad("Use a 24-hour time such as 18:30.");
        return raw;
    }

    public static DateOnly Day(string? raw)
    {
        if (!DateOnly.TryParseExact(raw, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var day)
            || day.Year is < 1900 or > 2199)
            throw Fault.Bad("Use a date from 1900 to 2199 in YYYY-MM-DD format.");
        return day;
    }

    public static DateOnly Monday(DateOnly day) => day.AddDays(-(((int)day.DayOfWeek + 6) % 7));

    public static DateOnly Week(string? raw)
    {
        var day = Day(raw);
        if (day.DayOfWeek != DayOfWeek.Monday) throw Fault.Bad("A week starts on Monday.");
        return day;
    }

    public static string Iso(DateOnly day) => day.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
    public static string? NullableText(this Microsoft.Data.Sqlite.SqliteDataReader row, int i) =>
        row.IsDBNull(i) ? null : row.GetString(i);
}
