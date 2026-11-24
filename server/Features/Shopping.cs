using System.Globalization;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace KitchenTable;

public sealed record ShoppingItem(string Id, string Label, decimal? Amount, string Unit, bool Manual, bool Done);
public sealed record ExtraInput(string? Label);

public static class Shopping
{
    private static string Normalise(string text) => Regex.Replace(text.Trim(), @"\s+", " ").ToLowerInvariant();

    public static List<ShoppingItem> Items(Session db, DateOnly week, List<Meal> meals, List<Recipe> recipes)
    {
        string start = Rules.Iso(week);
        var checkedKeys = db.Query("SELECT item_key FROM shopping_checks WHERE week=$w",
            r => r.GetString(0), ("$w", start)).ToHashSet(StringComparer.Ordinal);
        var book = recipes.ToDictionary(r => r.Id);
        var amounts = from meal in meals
                      let recipe = book[meal.RecipeId]
                      from ingredient in recipe.Ingredients
                      group (ingredient, amount: ingredient.Amount * meal.Servings / recipe.Servings)
                      by (name: Normalise(ingredient.Name), unit: Normalise(ingredient.Unit), measured: ingredient.Amount.HasValue);
        var items = new List<ShoppingItem>();
        foreach (var group in amounts)
        {
            var first = group.First().ingredient;
            decimal? amount = group.Key.measured ? decimal.Round(group.Sum(i => i.amount ?? 0m), 6, MidpointRounding.AwayFromZero) : null;
            // Checking a given quantity does not silently mark a changed requirement as bought.
            var parts = new[] { group.Key.name, group.Key.unit, amount?.ToString("0.######", CultureInfo.InvariantCulture) };
            var key = Convert.ToHexStringLower(SHA256.HashData(JsonSerializer.SerializeToUtf8Bytes(parts)));
            items.Add(new(key, first.Name, amount, first.Unit, false, checkedKeys.Contains(key)));
        }
        items.AddRange(db.Query("SELECT id,label,done FROM extras WHERE week=$w",
            r => new ShoppingItem(r.GetString(0), r.GetString(1), null, "", true, r.GetBoolean(2)), ("$w", start)));
        return items.OrderBy(i => i.Label, StringComparer.OrdinalIgnoreCase)
            .ThenBy(i => i.Unit, StringComparer.OrdinalIgnoreCase).ThenBy(i => i.Id, StringComparer.Ordinal).ToList();
    }

    public static void SetCheck(Session db, DateOnly week, string id, bool done)
    {
        var items = Items(db, week, Planning.Meals(db, week), Recipes.List(db));
        var item = items.FirstOrDefault(i => i.Id == id) ?? throw Fault.Conflict("This list changed. Refresh and try again.");
        string start = Rules.Iso(week);
        if (item.Manual) db.Exec("UPDATE extras SET done=$done WHERE week=$w AND id=$id",
            ("$done", done), ("$w", start), ("$id", id));
        else if (done) db.Exec("INSERT OR IGNORE INTO shopping_checks(week,item_key) VALUES($w,$id)", ("$w", start), ("$id", id));
        else db.Exec("DELETE FROM shopping_checks WHERE week=$w AND item_key=$id", ("$w", start), ("$id", id));
    }

    public static void AddExtra(Session db, DateOnly week, string id, ExtraInput input)
    {
        string label = Rules.Text(input.Label, "Shopping item", 120);
        var existing = db.Query("SELECT week,label FROM extras WHERE id=$id", r => (r.GetString(0), r.GetString(1)),
            ("$id", id)).SingleOrDefault();
        if (existing != default)
        {
            if (existing != (Rules.Iso(week), label)) throw Fault.Conflict("This shopping item already exists.");
            return;
        }
        db.Exec("INSERT INTO extras(id,week,label) VALUES($id,$w,$label)", ("$id", id), ("$w", Rules.Iso(week)), ("$label", label));
    }
}
