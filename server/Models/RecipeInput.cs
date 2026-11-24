namespace KitchenTable.Models;

public sealed record RecipeInput(
    string? Title,
    int Servings,
    Ingredient?[]? Ingredients,
    string?[]? Steps,
    int Version);
