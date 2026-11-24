namespace KitchenTable.Models;

public sealed record MealInput(
    string? Day,
    string? Slot,
    string? RecipeId,
    int Servings,
    int Version);
