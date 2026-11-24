using System.Text.Json;
using KitchenTable.Models;

namespace KitchenTable.Infrastructure;

// All reads use the caller's transaction so the planner and shopping list agree on one week.
internal static class HouseholdQueries
{
    public static List<Person> People(DatabaseSession session)
    {
        return session.Query(
            "SELECT id, name, colour, version FROM people ORDER BY name COLLATE NOCASE, id",
            row => new Person(
                Id: row.GetString(0),
                Name: row.GetString(1),
                Colour: row.GetString(2),
                Version: row.GetInt32(3)));
    }

    public static List<Recipe> Recipes(DatabaseSession session)
    {
        return session.Query(
            """
            SELECT id, title, servings, ingredients, steps, version
            FROM recipes ORDER BY title COLLATE NOCASE, id
            """,
            row => new Recipe(
                Id: row.GetString(0),
                Title: row.GetString(1),
                Servings: row.GetInt32(2),
                Ingredients: JsonSerializer.Deserialize<Ingredient[]>(row.GetString(3), JsonSerializerOptions.Web)!,
                Steps: JsonSerializer.Deserialize<string[]>(row.GetString(4), JsonSerializerOptions.Web)!,
                Version: row.GetInt32(5)));
    }

    public static List<Entry> Entries(DatabaseSession session, DateOnly start)
    {
        return session.Query(
            """
            SELECT id, day, kind, title, person_id, start_time, end_time, done, version
            FROM entries
            WHERE day >= $start AND day < $end
            ORDER BY day, start_time, title COLLATE NOCASE, id
            """,
            row => new Entry(
                Id: row.GetString(0),
                Day: row.GetString(1),
                Kind: row.GetString(2),
                Title: row.GetString(3),
                PersonId: row.IsDBNull(4) ? null : row.GetString(4),
                StartTime: row.IsDBNull(5) ? null : row.GetString(5),
                EndTime: row.IsDBNull(6) ? null : row.GetString(6),
                Done: row.GetBoolean(7),
                Version: row.GetInt32(8)),
            ("$start", CalendarDates.Format(start)),
            ("$end", CalendarDates.Format(start.AddDays(7))));
    }

    public static List<Meal> Meals(DatabaseSession session, DateOnly start)
    {
        return session.Query(
            """
            SELECT id, day, slot, recipe_id, servings, version
            FROM meals
            WHERE day >= $start AND day < $end
            ORDER BY day, CASE slot WHEN 'Breakfast' THEN 1 WHEN 'Lunch' THEN 2 WHEN 'Dinner' THEN 3 ELSE 4 END
            """,
            row => new Meal(
                Id: row.GetString(0),
                Day: row.GetString(1),
                Slot: row.GetString(2),
                RecipeId: row.GetString(3),
                Servings: row.GetInt32(4),
                Version: row.GetInt32(5)),
            ("$start", CalendarDates.Format(start)),
            ("$end", CalendarDates.Format(start.AddDays(7))));
    }
}
