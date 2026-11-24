using KitchenTable.Infrastructure;
using KitchenTable.Infrastructure.Interfaces;
using KitchenTable.Models;
using KitchenTable.Services.Abstract;
using KitchenTable.Services.Interfaces;

namespace KitchenTable.Services.Concrete;

public sealed class EntryService(IDatabase database)
    : VersionedService<EntryInput>(database, "entries"), IEntryService
{
    protected override void SaveRecord(DatabaseSession session, string id, EntryInput input)
    {
        var day = CalendarDates.Format(CalendarDates.ParseDay(input.Day));
        var title = InputRules.RequiredText(input.Title, "Title", 140);

        if (input.Kind is not ("event" or "chore"))
        {
            throw ApiException.BadRequest("Choose an event or a chore.");
        }

        var personId = ResolvePerson(session, input.PersonId);
        var start = InputRules.OptionalTime(input.StartTime);
        var end = InputRules.OptionalTime(input.EndTime);

        if (end != null && (start == null || string.CompareOrdinal(start, end) >= 0))
        {
            throw ApiException.BadRequest("The end time must be after the start time on the same day.");
        }

        int version = NextVersion(session, id, input.Version);
        session.Execute(
            """
            INSERT INTO entries (id, day, kind, title, person_id, start_time, end_time, version)
            VALUES ($id, $day, $kind, $title, $person, $start, $end, $version)
            ON CONFLICT(id) DO UPDATE SET
                day = excluded.day,
                kind = excluded.kind,
                title = excluded.title,
                person_id = excluded.person_id,
                start_time = excluded.start_time,
                end_time = excluded.end_time,
                done = CASE WHEN excluded.kind = 'chore' THEN entries.done ELSE 0 END,
                version = excluded.version
            """,
            ("$id", id),
            ("$day", day),
            ("$kind", input.Kind),
            ("$title", title),
            ("$person", personId),
            ("$start", start),
            ("$end", end),
            ("$version", version));
    }

    public void SetDone(Guid id, DoneInput input)
    {
        bool done = InputRules.CheckedState(input.Done);

        Database.Write(session =>
        {
            int changed = session.Execute(
                """
                UPDATE entries
                SET version = version + CASE WHEN done = $done THEN 0 ELSE 1 END,
                    done = $done
                WHERE id = $id AND kind = 'chore'
                """,
                ("$done", done),
                ("$id", id.ToString("N")));

            if (changed == 0)
            {
                throw ApiException.NotFound("This chore is no longer on the calendar.");
            }
        });
    }

    private static string? ResolvePerson(DatabaseSession session, string? personId)
    {
        if (personId == null)
        {
            return null;
        }

        if (Guid.TryParse(personId, out var parsed))
        {
            string key = parsed.ToString("N");
            if (session.GetVersion("people", key) > 0)
            {
                return key;
            }
        }

        throw ApiException.BadRequest("Choose a current household member.");
    }
}
