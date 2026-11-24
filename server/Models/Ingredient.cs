namespace KitchenTable.Models;

public sealed record Ingredient(
    string Name,
    decimal? Amount,
    string Unit);
