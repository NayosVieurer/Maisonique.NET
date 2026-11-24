namespace KitchenTable;

public sealed record Person(string Id, string Name, string Colour, int Version);
public sealed record PersonInput(string? Name, string? Colour, int Version);
public sealed record Entry(string Id, string Day, string Kind, string Title, string? PersonId,
    string? StartTime, string? EndTime, bool Done, int Version);
public sealed record EntryInput(string? Day, string? Kind, string? Title, string? PersonId,
    string? StartTime, string? EndTime, int Version);
public sealed record DoneInput(bool? Done)
{
    public bool Required() => Done ?? throw Fault.Bad("Supply a checked state.");
}

public static class Calendar
{
    public static List<Person> People(Session db) => db.Query(
        "SELECT id,name,colour,version FROM people ORDER BY name COLLATE NOCASE,id",
        r => new Person(r.GetString(0), r.GetString(1), r.GetString(2), r.GetInt32(3)));

    public static void SavePerson(Session db, string id, PersonInput input)
    {
        var name = Rules.Text(input.Name, "Name", 60);
        var colour = input.Colour?.Trim();
        if (colour is not { Length: 7 } || colour[0] != '#' || !colour.Skip(1).All(Uri.IsHexDigit))
            throw Fault.Bad("Choose a six-digit hex colour.");
        var version = db.NextVersion("people", id, input.Version);
        db.Exec("""
            INSERT INTO people(id,name,colour,version) VALUES($id,$name,$colour,$v)
            ON CONFLICT(id) DO UPDATE SET name=excluded.name,colour=excluded.colour,version=excluded.version
            """, ("$id", id), ("$name", name), ("$colour", colour), ("$v", version));
    }

    public static List<Entry> Entries(Session db, DateOnly week) => db.Query("""
        SELECT id,day,kind,title,person_id,start_time,end_time,done,version FROM entries
        WHERE day >= $start AND day < $end ORDER BY day,start_time,title COLLATE NOCASE,id
        """, r => new Entry(r.GetString(0), r.GetString(1), r.GetString(2), r.GetString(3),
            r.NullableText(4), r.NullableText(5), r.NullableText(6), r.GetBoolean(7), r.GetInt32(8)),
        ("$start", Rules.Iso(week)), ("$end", Rules.Iso(week.AddDays(7))));

    public static void SaveEntry(Session db, string id, EntryInput input)
    {
        var day = Rules.Iso(Rules.Day(input.Day));
        var title = Rules.Text(input.Title, "Title", 140);
        if (input.Kind is not ("event" or "chore")) throw Fault.Bad("Choose an event or a chore.");
        string? personId = null;
        if (input.PersonId is not null)
        {
            if (!Guid.TryParse(input.PersonId, out var person) || db.Version("people", Rules.Id(person)) == 0)
                throw Fault.Bad("Choose a current household member.");
            personId = Rules.Id(person);
        }
        var start = Rules.Clock(input.StartTime);
        var end = Rules.Clock(input.EndTime);
        if (end != null && (start == null || string.CompareOrdinal(start, end) >= 0))
            throw Fault.Bad("The end time must be after the start time on the same day.");
        var version = db.NextVersion("entries", id, input.Version);
        db.Exec("""
            INSERT INTO entries(id,day,kind,title,person_id,start_time,end_time,version)
            VALUES($id,$day,$kind,$title,$person,$start,$end,$v)
            ON CONFLICT(id) DO UPDATE SET day=excluded.day,kind=excluded.kind,title=excluded.title,
                person_id=excluded.person_id,start_time=excluded.start_time,end_time=excluded.end_time,
                done=CASE WHEN excluded.kind='chore' THEN entries.done ELSE 0 END,version=excluded.version
            """, ("$id", id), ("$day", day), ("$kind", input.Kind), ("$title", title),
            ("$person", personId), ("$start", start), ("$end", end), ("$v", version));
    }

    public static void SetChore(Session db, string id, bool done)
    {
        var updated = db.Exec("""
            UPDATE entries SET version=version+CASE WHEN done=$done THEN 0 ELSE 1 END, done=$done
            WHERE id=$id AND kind='chore'
            """, ("$done", done), ("$id", id));
        if (updated == 0) throw Fault.Missing("This chore is no longer on the calendar.");
    }
}
