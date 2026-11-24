using KitchenTable.Infrastructure;
using KitchenTable.Infrastructure.Interfaces;
using KitchenTable.Models;
using KitchenTable.Services.Interfaces;

namespace KitchenTable.Services.Concrete;

public sealed class ShoppingService(IDatabase database) : IShoppingService
{
    public void AddExtra(string week, Guid id, ExtraInput input)
    {
        var start = CalendarDates.Format(CalendarDates.ParseWeekStart(week));
        var key = id.ToString("N");
        var label = InputRules.RequiredText(input.Label, "Shopping item", 120);

        database.Write(session =>
        {
            var existing = session.Query(
                "SELECT week, label FROM extras WHERE id = $id",
                row => (Week: row.GetString(0), Label: row.GetString(1)),
                ("$id", key)
            ).SingleOrDefault();

            if (existing != default)
            {
                if (existing != (start, label))
                {
                    throw ApiException.Conflict("This shopping item already exists.");
                }

                return;
            }

            session.Execute(
                "INSERT INTO extras (id, week, label) VALUES ($id, $week, $label)",
                ("$id", key),
                ("$week", start),
                ("$label", label));
        });
    }

    public void DeleteExtra(string week, Guid id)
    {
        string start = CalendarDates.Format(CalendarDates.ParseWeekStart(week));

        database.Write(session => session.Execute(
            "DELETE FROM extras WHERE week = $week AND id = $id",
            ("$week", start),
            ("$id", id.ToString("N"))));
    }

    public void SetDone(string week, string itemId, DoneInput input)
    {
        DateOnly start = CalendarDates.ParseWeekStart(week);
        bool done = InputRules.CheckedState(input.Done);

        database.Write(session =>
        {
            var meals = HouseholdQueries.Meals(session, start);
            var recipes = HouseholdQueries.Recipes(session);
            var items = ShoppingListQuery.Load(session, start, meals, recipes);
            var item = items.FirstOrDefault(row => row.Id == itemId);

            if (item == null)
            {
                throw ApiException.Conflict("This list changed. Refresh and try again.");
            }

            if (item.Manual)
            {
                session.Execute(
                    "UPDATE extras SET done = $done WHERE week = $week AND id = $id",
                    ("$done", done),
                    ("$week", week),
                    ("$id", itemId));
            }
            else if (done)
            {
                session.Execute(
                    "INSERT OR IGNORE INTO shopping_checks (week, item_key) VALUES ($week, $id)",
                    ("$week", week),
                    ("$id", itemId));
            }
            else
            {
                session.Execute(
                    "DELETE FROM shopping_checks WHERE week = $week AND item_key = $id",
                    ("$week", week),
                    ("$id", itemId));
            }
        });
    }
}
