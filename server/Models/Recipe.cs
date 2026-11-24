namespace KitchenTable.Models;

public sealed record Recipe(
    string Id,
    string Title,
    int Servings,
    Ingredient[] Ingredients,
    string[] Steps,
    int Version);
