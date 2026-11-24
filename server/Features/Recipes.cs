using System.Text.Json;

namespace KitchenTable;

public sealed record Ingredient(string Name, decimal? Amount, string Unit);
public sealed record Recipe(string Id, string Title, int Servings, Ingredient[] Ingredients, string[] Steps, int Version);
public sealed record RecipeInput(string? Title, int Servings, Ingredient?[]? Ingredients, string?[]? Steps, int Version);

public static class Recipes
{
    public static List<Recipe> List(Session db) => db.Query(
        "SELECT id,title,servings,ingredients,steps,version FROM recipes ORDER BY title COLLATE NOCASE,id",
        r => new Recipe(r.GetString(0), r.GetString(1), r.GetInt32(2),
            JsonSerializer.Deserialize<Ingredient[]>(r.GetString(3), Rules.Json)!,
            JsonSerializer.Deserialize<string[]>(r.GetString(4), Rules.Json)!, r.GetInt32(5)));

    public static void Save(Session db, string id, RecipeInput input)
    {
        var title = Rules.Text(input.Title, "Recipe title", 120);
        var servings = Rules.Servings(input.Servings);
        if (input.Ingredients is not { Length: >= 1 and <= 100 }) throw Fault.Bad("Add 1 to 100 ingredients.");
        if (input.Steps is not { Length: >= 1 and <= 100 }) throw Fault.Bad("Add 1 to 100 cooking steps.");
        var ingredients = input.Ingredients.Select(ingredient =>
        {
            if (ingredient is null) throw Fault.Bad("Each ingredient needs a name.");
            var name = Rules.Text(ingredient.Name, "Ingredient name", 100);
            string unit = ingredient.Unit?.Trim() ?? "";
            if (unit.Length > 24) throw Fault.Bad("Use a unit of at most 24 characters.");
            if (ingredient.Amount is decimal n && (n < 0.001m || n > 100000 || n != decimal.Round(n, 3)))
                throw Fault.Bad("Use a positive amount up to 100,000 with at most three decimal places.");
            return new Ingredient(name, ingredient.Amount, unit);
        }).ToArray();
        var steps = input.Steps.Select(s => Rules.Text(s, "Cooking step", 2000)).ToArray();
        var version = db.NextVersion("recipes", id, input.Version);
        db.Exec("""
            INSERT INTO recipes(id,title,servings,ingredients,steps,version)
            VALUES($id,$title,$servings,$ingredients,$steps,$v)
            ON CONFLICT(id) DO UPDATE SET title=excluded.title, servings=excluded.servings,
                ingredients=excluded.ingredients, steps=excluded.steps, version=excluded.version
            """, ("$id", id), ("$title", title), ("$servings", servings),
            ("$ingredients", JsonSerializer.Serialize(ingredients, Rules.Json)),
            ("$steps", JsonSerializer.Serialize(steps, Rules.Json)), ("$v", version));
    }
}
