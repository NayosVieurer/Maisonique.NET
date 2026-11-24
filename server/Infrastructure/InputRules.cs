using System.Globalization;

namespace KitchenTable.Infrastructure;

internal static class InputRules
{
    public static string RequiredText(string? raw, string field, int maxLength)
    {
        var value = raw?.Trim();

        if (string.IsNullOrEmpty(value) || value.Length > maxLength)
        {
            throw ApiException.BadRequest($"{field} must contain 1 to {maxLength} characters.");
        }

        return value;
    }

    public static int Servings(int value)
    {
        if (value is < 1 or > 64)
        {
            throw ApiException.BadRequest("Servings must be a whole number from 1 to 64.");
        }

        return value;
    }

    public static string? OptionalTime(string? value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return null;
        }

        if (!TimeOnly.TryParseExact(value, "HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
        {
            throw ApiException.BadRequest("Use a 24-hour time such as 18:30.");
        }

        return value;
    }

    public static bool CheckedState(bool? value) =>
        value ?? throw ApiException.BadRequest("Supply a checked state.");
}
