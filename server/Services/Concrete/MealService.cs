using KitchenTable.Infrastructure;
using KitchenTable.Infrastructure.Interfaces;
using KitchenTable.Models;
using KitchenTable.Services.Abstract;
using KitchenTable.Services.Interfaces;

namespace KitchenTable.Services.Concrete;

public sealed class MealService(IDatabase database)
    : VersionedService<MealInput>(database, "meals"), IMealService
{
    protected override void SaveRecord(DatabaseSession session, string id, MealInput input)
    {
        var day = CalendarDates.Format(CalendarDates.ParseDay(input.Day));

        if (input.Slot is not ("Breakfast" or "Lunch" or "Dinner" or "Snack"))
        {
            throw ApiException.BadRequest("Choose a meal slot.");
        }

        if (!Guid.TryParse(input.RecipeId, out var recipe) || session.GetVersion("recipes", recipe.ToString("N")) == 0)
        {
            throw ApiException.BadRequest("Choose a recipe from the cookbook.");
        }

        int servings = InputRules.Servings(input.Servings);
        int version = NextVersion(session, id, input.Version);

        bool occupied = session.Query(
            "SELECT id FROM meals WHERE day = $day AND slot = $slot AND id <> $id",
            row => row.GetString(0),
            ("$day", day),
            ("$slot", input.Slot),
            ("$id", id)
        ).Count > 0;

        if (occupied)
        {
            throw ApiException.Conflict("That meal slot is already filled. Open the existing meal to change it.");
        }

        session.Execute(
            """
            INSERT INTO meals (id, day, slot, recipe_id, servings, version)
            VALUES ($id, $day, $slot, $recipe, $servings, $version)
            ON CONFLICT(id) DO UPDATE SET
                day = excluded.day,
                slot = excluded.slot,
                recipe_id = excluded.recipe_id,
                servings = excluded.servings,
                version = excluded.version
            """,
            ("$id", id),
            ("$day", day),
            ("$slot", input.Slot),
            ("$recipe", recipe.ToString("N")),
            ("$servings", servings),
            ("$version", version));
    }
}
