namespace KitchenTable.Models;

public sealed record WeekSnapshot(
    string Start,
    string Today,
    string TimeZone,
    IReadOnlyList<Person> People,
    IReadOnlyList<Recipe> Recipes,
    IReadOnlyList<Entry> Entries,
    IReadOnlyList<Meal> Meals,
    IReadOnlyList<ShoppingItem> Shopping);
