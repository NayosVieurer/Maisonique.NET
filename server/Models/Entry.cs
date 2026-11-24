namespace KitchenTable.Models;

public sealed record Entry(
    string Id,
    string Day,
    string Kind,
    string Title,
    string? PersonId,
    string? StartTime,
    string? EndTime,
    bool Done,
    int Version);
