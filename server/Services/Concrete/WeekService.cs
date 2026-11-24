using KitchenTable.Infrastructure;
using KitchenTable.Infrastructure.Interfaces;
using KitchenTable.Models;
using KitchenTable.Services.Interfaces;

namespace KitchenTable.Services.Concrete;

public sealed class WeekService(IDatabase database, TimeZoneInfo householdZone) : IWeekService
{
    public WeekSnapshot GetWeek(string? start)
    {
        var localNow = TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, householdZone);
        var today = DateOnly.FromDateTime(localNow.DateTime);
        var week = start == null ? CalendarDates.MondayOf(today) : CalendarDates.ParseWeekStart(start);

        return database.Read(session =>
        {
            var recipes = HouseholdQueries.Recipes(session);
            var meals = HouseholdQueries.Meals(session, week);

            return new WeekSnapshot(
                Start: CalendarDates.Format(week),
                Today: CalendarDates.Format(today),
                TimeZone: householdZone.Id,
                People: HouseholdQueries.People(session),
                Recipes: recipes,
                Entries: HouseholdQueries.Entries(session, week),
                Meals: meals,
                Shopping: ShoppingListQuery.Load(session, week, meals, recipes));
        });
    }
}
