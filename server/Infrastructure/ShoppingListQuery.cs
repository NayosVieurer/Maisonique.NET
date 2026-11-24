using System.Globalization;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.RegularExpressions;
using KitchenTable.Models;

namespace KitchenTable.Infrastructure;

internal static class ShoppingListQuery
{
    public static List<ShoppingItem> Load(
        DatabaseSession session,
        DateOnly week,
        IReadOnlyList<Meal> meals,
        IReadOnlyList<Recipe> recipes)
    {
        string start = CalendarDates.Format(week);
        var checkedKeys = session.Query(
            "SELECT item_key FROM shopping_checks WHERE week = $week",
            row => row.GetString(0),
            ("$week", start)
        ).ToHashSet(StringComparer.Ordinal);

        var extras = session.Query(
            "SELECT id, label, done FROM extras WHERE week = $week",
            row => new ShoppingItem(
                Id: row.GetString(0),
                Label: row.GetString(1),
                Amount: null,
                Unit: "",
                Manual: true,
                Done: row.GetBoolean(2)),
            ("$week", start));

        return IngredientsForMeals(meals, recipes, checkedKeys)
            .Concat(extras)
            .OrderBy(item => item.Label, StringComparer.OrdinalIgnoreCase)
            .ThenBy(item => item.Unit, StringComparer.OrdinalIgnoreCase)
            .ThenBy(item => item.Id, StringComparer.Ordinal)
            .ToList();
    }

    private static IEnumerable<ShoppingItem> IngredientsForMeals(
        IReadOnlyList<Meal> meals,
        IReadOnlyList<Recipe> recipes,
        HashSet<string> checkedKeys)
    {
        var recipeById = recipes.ToDictionary(recipe => recipe.Id);

        var groups =
            from meal in meals
            let recipe = recipeById[meal.RecipeId]
            from ingredient in recipe.Ingredients
            let portion = ingredient.Amount * meal.Servings / recipe.Servings
            group (Ingredient: ingredient, Portion: portion) by new
            {
                Name = Normalise(ingredient.Name),
                Unit = Normalise(ingredient.Unit),
                IsMeasured = ingredient.Amount.HasValue
            };

        foreach (var group in groups)
        {
            var first = group.First().Ingredient;
            decimal? total = null;

            if (group.Key.IsMeasured)
            {
                decimal sum = group.Sum(item => item.Portion ?? 0m);
                total = decimal.Round(sum, 6, MidpointRounding.AwayFromZero);
            }

            string key = QuantityKey(group.Key.Name, group.Key.Unit, total);
            yield return new ShoppingItem(
                Id: key,
                Label: first.Name,
                Amount: total,
                Unit: first.Unit,
                Manual: false,
                Done: checkedKeys.Contains(key));
        }
    }

    private static string Normalise(string value) =>
        Regex.Replace(value.Trim(), @"\s+", " ").ToLowerInvariant();

    // This encoding is persisted in shopping_checks. Keep it stable across application releases.
    private static string QuantityKey(string name, string unit, decimal? total)
    {
        string? quantity = total?.ToString("0.######", CultureInfo.InvariantCulture);
        byte[] json = JsonSerializer.SerializeToUtf8Bytes(new[] { name, unit, quantity });

        return Convert.ToHexStringLower(SHA256.HashData(json));
    }
}
