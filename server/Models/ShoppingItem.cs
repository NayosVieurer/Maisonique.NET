namespace KitchenTable.Models;

public sealed record ShoppingItem(
    string Id,
    string Label,
    decimal? Amount,
    string Unit,
    bool Manual,
    bool Done);
