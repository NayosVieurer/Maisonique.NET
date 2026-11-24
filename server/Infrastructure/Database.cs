using System.Globalization;
using KitchenTable.Infrastructure.Interfaces;
using Microsoft.Data.Sqlite;

namespace KitchenTable.Infrastructure;

public sealed class Database : IDatabase
{
    private readonly string _connectionString;

    public Database(string path)
    {
        string fullPath = Path.GetFullPath(path);
        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);

        _connectionString = new SqliteConnectionStringBuilder
        {
            DataSource = fullPath,
            ForeignKeys = true,
            DefaultTimeout = 5
        }.ToString();
    }

    public void Migrate()
    {
        using var connection = OpenConnection();

        using (var enableWal = connection.CreateCommand())
        {
            enableWal.CommandText = "PRAGMA journal_mode=WAL";
            enableWal.ExecuteScalar();
        }

        using var transaction = connection.BeginTransaction();
        var session = new DatabaseSession(connection, transaction);
        session.Execute("CREATE TABLE IF NOT EXISTS schema_versions(version INTEGER PRIMARY KEY)");

        var assembly = typeof(Database).Assembly;
        var scripts = assembly.GetManifestResourceNames()
            .Where(name => name.Contains(".Migrations.") && name.EndsWith(".sql", StringComparison.Ordinal))
            .Order(StringComparer.Ordinal)
            .ToArray();

        if (scripts.Length == 0)
        {
            throw new InvalidOperationException("The build contains no database migrations.");
        }

        var installed = session.Query("SELECT version FROM schema_versions ORDER BY version", row => row.GetInt32(0));
        if (installed.Count > scripts.Length || !installed.SequenceEqual(Enumerable.Range(1, installed.Count)))
        {
            throw new InvalidOperationException("This database requires a different application version.");
        }

        for (int index = 0; index < scripts.Length; index++)
        {
            string name = scripts[index];
            string fileName = name.Split('.')[^2];
            int version = int.Parse(fileName.Split('_')[0], CultureInfo.InvariantCulture);

            if (version != index + 1)
            {
                throw new InvalidOperationException($"Migration sequence error at {fileName}.");
            }

            if (version <= installed.Count)
            {
                continue;
            }

            using var reader = new StreamReader(assembly.GetManifestResourceStream(name)!);
            session.Execute(reader.ReadToEnd());
            session.Execute("INSERT INTO schema_versions VALUES ($version)", ("$version", version));
        }

        transaction.Commit();
    }

    public T Read<T>(Func<DatabaseSession, T> read)
    {
        using var connection = OpenConnection();
        using var transaction = connection.BeginTransaction(deferred: true);

        var result = read(new DatabaseSession(connection, transaction));
        transaction.Commit();

        return result;
    }

    public void Write(Action<DatabaseSession> write)
    {
        using var connection = OpenConnection();
        using var transaction = connection.BeginTransaction(deferred: false);

        write(new DatabaseSession(connection, transaction));
        transaction.Commit();
    }

    private SqliteConnection OpenConnection()
    {
        var connection = new SqliteConnection(_connectionString);
        try
        {
            connection.Open();
            return connection;
        }
        catch
        {
            connection.Dispose();
            throw;
        }
    }
}
