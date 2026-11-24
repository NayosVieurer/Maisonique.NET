using System.Text.Json;
using KitchenTable.Infrastructure;
using KitchenTable.Infrastructure.Interfaces;
using KitchenTable.Models;
using KitchenTable.Services.Abstract;
using KitchenTable.Services.Interfaces;

namespace KitchenTable.Services.Concrete;

public sealed class RecipeService(IDatabase database)
    : VersionedService<RecipeInput>(database, "recipes"), IRecipeService
{
    protected override void SaveRecord(DatabaseSession session, string id, RecipeInput input)
    {
        var title = InputRules.RequiredText(input.Title, "Recipe title", 120);
        int servings = InputRules.Servings(input.Servings);

        if (input.Ingredients is not { Length: >= 1 and <= 100 })
        {
            throw ApiException.BadRequest("Add 1 to 100 ingredients.");
        }

        if (input.Steps is not { Length: >= 1 and <= 100 })
        {
            throw ApiException.BadRequest("Add 1 to 100 cooking steps.");
        }

        var ingredients = input.Ingredients.Select(ValidateIngredient).ToArray();
        var steps = input.Steps
            .Select(step => InputRules.RequiredText(step, "Cooking step", 2000))
            .ToArray();

        int version = NextVersion(session, id, input.Version);
        session.Execute(
            """
            INSERT INTO recipes (id, title, servings, ingredients, steps, version)
            VALUES ($id, $title, $servings, $ingredients, $steps, $version)
            ON CONFLICT(id) DO UPDATE SET
                title = excluded.title,
                servings = excluded.servings,
                ingredients = excluded.ingredients,
                steps = excluded.steps,
                version = excluded.version
            """,
            ("$id", id),
            ("$title", title),
            ("$servings", servings),
            ("$ingredients", JsonSerializer.Serialize(ingredients, JsonSerializerOptions.Web)),
            ("$steps", JsonSerializer.Serialize(steps, JsonSerializerOptions.Web)),
            ("$version", version));
    }

    private static Ingredient ValidateIngredient(Ingredient? ingredient)
    {
        if (ingredient is null)
        {
            throw ApiException.BadRequest("Each ingredient needs a name.");
        }

        var name = InputRules.RequiredText(ingredient.Name, "Ingredient name", 100);
        string unit = ingredient.Unit?.Trim() ?? "";

        if (unit.Length > 24)
        {
            throw ApiException.BadRequest("Use a unit of at most 24 characters.");
        }

        if (ingredient.Amount is decimal amount &&
            (amount is < 0.001m or > 100_000m || amount != decimal.Round(amount, 3)))
        {
            throw ApiException.BadRequest("Use a positive amount up to 100,000 with at most three decimal places.");
        }

        return new Ingredient(name, ingredient.Amount, unit);
    }
}
