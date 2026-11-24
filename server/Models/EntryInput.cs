namespace KitchenTable.Models;

public sealed record EntryInput(
    string? Day,
    string? Kind,
    string? Title,
    string? PersonId,
    string? StartTime,
    string? EndTime,
    int Version);
