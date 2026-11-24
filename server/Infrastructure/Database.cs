using System.Globalization;
using Microsoft.Data.Sqlite;

namespace KitchenTable;

public sealed class Database
{
    private readonly string _connectionString;

    public Database(string path)
    {
        path = Path.GetFullPath(path);
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        _connectionString = new SqliteConnectionStringBuilder
        {
            DataSource = path,
            ForeignKeys = true,
            DefaultTimeout = 5
        }.ToString();
    }

    public void Migrate()
    {
        using var connection = new SqliteConnection(_connectionString);
        connection.Open();
        using var enableWal = connection.CreateCommand();
        enableWal.CommandText = "PRAGMA journal_mode=WAL";
        enableWal.ExecuteScalar();

        using var tx = connection.BeginTransaction();
        var db = new Session(connection, tx);
        db.Exec("CREATE TABLE IF NOT EXISTS schema_versions(version INTEGER PRIMARY KEY)");
        var assembly = typeof(Database).Assembly;
        var scripts = assembly.GetManifestResourceNames()
            .Where(name => name.Contains(".Migrations.") && name.EndsWith(".sql", StringComparison.Ordinal))
            .Order(StringComparer.Ordinal).ToArray();
        if (scripts.Length == 0) throw new InvalidOperationException("The build contains no database migrations.");
        var installed = db.Query("SELECT version FROM schema_versions ORDER BY version", r => r.GetInt32(0));
        if (!installed.SequenceEqual(Enumerable.Range(1, installed.Count)) || installed.Count > scripts.Length)
            throw new InvalidOperationException("This database requires a different application version.");
        for (int i = 0; i < scripts.Length; i++)
        {
            var filename = scripts[i].Split('.')[^2];
            if (int.Parse(filename.Split('_')[0], CultureInfo.InvariantCulture) != i + 1)
                throw new InvalidOperationException($"Migration sequence error at {filename}.");
            if (i < installed.Count) continue;
            using var reader = new StreamReader(assembly.GetManifestResourceStream(scripts[i])!);
            db.Exec(reader.ReadToEnd());
            db.Exec("INSERT INTO schema_versions VALUES ($v)", ("$v", i + 1));
        }
        tx.Commit();
    }

    // A deferred read transaction holds one snapshot; writes reserve the writer before validation.
    public T Read<T>(Func<Session, T> action) => InTransaction(action, deferred: true);

    public void Write(Action<Session> action) => InTransaction(db => { action(db); return true; }, deferred: false);

    private T InTransaction<T>(Func<Session, T> action, bool deferred)
    {
        using var connection = new SqliteConnection(_connectionString);
        connection.Open();
        using var tx = connection.BeginTransaction(deferred);
        var result = action(new Session(connection, tx));
        tx.Commit();
        return result;
    }
}

public sealed class Session(SqliteConnection connection, SqliteTransaction transaction)
{
    private SqliteCommand Command(string sql, (string, object?)[] parameters)
    {
        var command = connection.CreateCommand();
        command.Transaction = transaction;
        command.CommandText = sql;
        foreach (var (name, value) in parameters)
            command.Parameters.AddWithValue(name, value ?? DBNull.Value);
        return command;
    }

    public List<T> Query<T>(string sql, Func<SqliteDataReader, T> map, params (string, object?)[] parameters)
    {
        using var command = Command(sql, parameters);
        using var reader = command.ExecuteReader();
        var rows = new List<T>();
        while (reader.Read()) rows.Add(map(reader));
        return rows;
    }

    public int Exec(string sql, params (string, object?)[] parameters)
    {
        using var command = Command(sql, parameters);
        return command.ExecuteNonQuery();
    }

    // The table is one of the compile-time feature constants, never a request parameter.
    public int Version(string table, string id) =>
        Query($"SELECT version FROM {table} WHERE id=$id", r => r.GetInt32(0), ("$id", id)).SingleOrDefault();

    public int NextVersion(string table, string id, int expected)
    {
        if (Version(table, id) != expected || expected < 0)
            throw Fault.Conflict("Someone changed this item. Reopen it to see the latest version.");
        return checked(expected + 1);
    }

    public void Delete(string table, string id, int expected)
    {
        if (expected < 1) throw Fault.Bad("Supply the item's current version.");
        int current = Version(table, id);
        if (current == 0) return; // Handles a repeated successful delete.
        NextVersion(table, id, expected);
        Exec($"DELETE FROM {table} WHERE id=$id", ("$id", id));
    }
}
