namespace KitchenTable.Infrastructure.Interfaces;

public interface IDatabase
{
    void Migrate();

    T Read<T>(Func<DatabaseSession, T> read);

    void Write(Action<DatabaseSession> write);
}
