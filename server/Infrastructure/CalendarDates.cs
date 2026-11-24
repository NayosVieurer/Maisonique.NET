using System.Globalization;

namespace KitchenTable.Infrastructure;

internal static class CalendarDates
{
    private const string DateFormat = "yyyy-MM-dd";

    public static DateOnly ParseDay(string? value)
    {
        var valid = DateOnly.TryParseExact(
            value, DateFormat, CultureInfo.InvariantCulture, DateTimeStyles.None, out var day);

        if (!valid || day.Year is < 1900 or > 2199)
        {
            throw ApiException.BadRequest("Use a date from 1900 to 2199 in YYYY-MM-DD format.");
        }

        return day;
    }

    public static DateOnly ParseWeekStart(string? value)
    {
        var day = ParseDay(value);

        if (day.DayOfWeek != DayOfWeek.Monday)
        {
            throw ApiException.BadRequest("A week starts on Monday.");
        }

        return day;
    }

    public static DateOnly MondayOf(DateOnly day)
    {
        int daysSinceMonday = ((int)day.DayOfWeek + 6) % 7;
        return day.AddDays(-daysSinceMonday);
    }

    public static string Format(DateOnly day) =>
        day.ToString(DateFormat, CultureInfo.InvariantCulture);
}
