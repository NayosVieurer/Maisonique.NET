namespace KitchenTable.Models;

public sealed record Meal(
    string Id,
    string Day,
    string Slot,
    string RecipeId,
    int Servings,
    int Version);
