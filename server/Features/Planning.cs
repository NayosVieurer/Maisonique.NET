namespace KitchenTable;

public sealed record Meal(string Id, string Day, string Slot, string RecipeId, int Servings, int Version);
public sealed record MealInput(string? Day, string? Slot, string? RecipeId, int Servings, int Version);

public static class Planning
{
    public static List<Meal> Meals(Session db, DateOnly week) => db.Query("""
        SELECT id,day,slot,recipe_id,servings,version FROM meals WHERE day >= $start AND day < $end
        ORDER BY day,CASE slot WHEN 'Breakfast' THEN 1 WHEN 'Lunch' THEN 2 WHEN 'Dinner' THEN 3 ELSE 4 END
        """, r => new Meal(r.GetString(0), r.GetString(1), r.GetString(2), r.GetString(3),
            r.GetInt32(4), r.GetInt32(5)), ("$start", Rules.Iso(week)), ("$end", Rules.Iso(week.AddDays(7))));

    public static void Save(Session db, string id, MealInput input)
    {
        string day = Rules.Iso(Rules.Day(input.Day));
        if (input.Slot is not ("Breakfast" or "Lunch" or "Dinner" or "Snack")) throw Fault.Bad("Choose a meal slot.");
        if (!Guid.TryParse(input.RecipeId, out var recipe) || db.Version("recipes", Rules.Id(recipe)) == 0)
            throw Fault.Bad("Choose a recipe from the cookbook.");
        var servings = Rules.Servings(input.Servings);
        var version = db.NextVersion("meals", id, input.Version);
        bool occupied = db.Query("SELECT id FROM meals WHERE day=$day AND slot=$slot AND id<>$id",
            r => r.GetString(0), ("$day", day), ("$slot", input.Slot), ("$id", id)).Count > 0;
        if (occupied) throw Fault.Conflict("That meal slot is already filled. Open the existing meal to change it.");
        db.Exec("""
            INSERT INTO meals(id,day,slot,recipe_id,servings,version) VALUES($id,$day,$slot,$recipe,$servings,$v)
            ON CONFLICT(id) DO UPDATE SET day=excluded.day,slot=excluded.slot,recipe_id=excluded.recipe_id,
                servings=excluded.servings,version=excluded.version
            """, ("$id", id), ("$day", day), ("$slot", input.Slot), ("$recipe", Rules.Id(recipe)),
            ("$servings", servings), ("$v", version));
    }
}
