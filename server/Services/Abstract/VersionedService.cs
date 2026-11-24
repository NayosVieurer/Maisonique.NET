using KitchenTable.Infrastructure;
using KitchenTable.Infrastructure.Interfaces;

namespace KitchenTable.Services.Abstract;

public abstract class VersionedService<TInput>(IDatabase database, string table)
{
    protected IDatabase Database { get; } = database;

    public void Save(Guid id, TInput input)
    {
        string key = id.ToString("N");
        Database.Write(session => SaveRecord(session, key, input));
    }

    public void Delete(Guid id, int version)
    {
        string key = id.ToString("N");
        Database.Write(session => session.DeleteVersioned(table, key, version));
    }

    protected int NextVersion(DatabaseSession session, string id, int expected) =>
        session.NextVersion(table, id, expected);

    protected abstract void SaveRecord(DatabaseSession session, string id, TInput input);
}
