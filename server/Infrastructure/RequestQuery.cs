using System.Globalization;

namespace KitchenTable.Infrastructure;

internal static class RequestQuery
{
    // Preserve the distinction between an omitted parameter and an explicitly empty one.
    public static string? OptionalValue(this IQueryCollection query, string name)
    {
        return query.TryGetValue(name, out var values) ? values.ToString() : null;
    }

    public static int RequiredVersion(this IQueryCollection query)
    {
        var value = query.OptionalValue("version");

        if (!int.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out int version))
        {
            throw ApiException.BadRequest("Supply the item's current version.");
        }

        return version;
    }
}
