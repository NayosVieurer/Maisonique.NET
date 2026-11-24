namespace KitchenTable.Models;

public sealed record PersonInput(
    string? Name,
    string? Colour,
    int Version);
