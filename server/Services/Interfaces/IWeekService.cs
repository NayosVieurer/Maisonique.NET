using KitchenTable.Models;

namespace KitchenTable.Services.Interfaces;

public interface IWeekService
{
    WeekSnapshot GetWeek(string? start);
}
