using Microsoft.Data.Sqlite;

namespace KitchenTable.Infrastructure;

public sealed class DatabaseSession(SqliteConnection connection, SqliteTransaction transaction)
{
    public List<T> Query<T>(
        string sql,
        Func<SqliteDataReader, T> mapRow,
        params (string Name, object? Value)[] parameters)
    {
        using var command = CreateCommand(sql, parameters);
        using var reader = command.ExecuteReader();

        var rows = new List<T>();
        while (reader.Read())
        {
            rows.Add(mapRow(reader));
        }

        return rows;
    }

    public int Execute(string sql, params (string Name, object? Value)[] parameters)
    {
        using var command = CreateCommand(sql, parameters);
        return command.ExecuteNonQuery();
    }

    // Only the fixed table names in the services are interpolated. All incoming values are parameters.
    public int GetVersion(string table, string id)
    {
        return Query(
            $"SELECT version FROM {table} WHERE id = $id",
            row => row.GetInt32(0),
            ("$id", id)
        ).SingleOrDefault();
    }

    public int NextVersion(string table, string id, int expected)
    {
        EnsureVersion(GetVersion(table, id), expected);
        return checked(expected + 1);
    }

    public void DeleteVersioned(string table, string id, int expected)
    {
        if (expected < 1)
        {
            throw ApiException.BadRequest("Supply the item's current version.");
        }

        int current = GetVersion(table, id);
        if (current == 0)
        {
            return; // A repeated successful delete is safe.
        }

        EnsureVersion(current, expected);
        Execute($"DELETE FROM {table} WHERE id = $id", ("$id", id));
    }

    private static void EnsureVersion(int current, int expected)
    {
        if (current != expected || expected < 0)
        {
            throw ApiException.Conflict("Someone changed this item. Reopen it to see the latest version.");
        }
    }

    private SqliteCommand CreateCommand(string sql, (string Name, object? Value)[] parameters)
    {
        var command = connection.CreateCommand();
        command.Transaction = transaction;
        command.CommandText = sql;

        foreach (var (name, value) in parameters)
        {
            command.Parameters.AddWithValue(name, value ?? DBNull.Value);
        }

        return command;
    }
}
