using KitchenTable.Infrastructure;
using KitchenTable.Infrastructure.Interfaces;
using KitchenTable.Models;
using KitchenTable.Services.Abstract;
using KitchenTable.Services.Interfaces;

namespace KitchenTable.Services.Concrete;

public sealed class PersonService(IDatabase database)
    : VersionedService<PersonInput>(database, "people"), IPersonService
{
    protected override void SaveRecord(DatabaseSession session, string id, PersonInput input)
    {
        var name = InputRules.RequiredText(input.Name, "Name", 60);
        var colour = input.Colour?.Trim();

        if (colour is not { Length: 7 } || colour[0] != '#' || !colour.Skip(1).All(Uri.IsHexDigit))
        {
            throw ApiException.BadRequest("Choose a six-digit hex colour.");
        }

        int version = NextVersion(session, id, input.Version);
        session.Execute(
            """
            INSERT INTO people (id, name, colour, version)
            VALUES ($id, $name, $colour, $version)
            ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                colour = excluded.colour,
                version = excluded.version
            """,
            ("$id", id),
            ("$name", name),
            ("$colour", colour),
            ("$version", version));
    }
}
