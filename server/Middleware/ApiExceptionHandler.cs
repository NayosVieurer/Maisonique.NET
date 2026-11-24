using KitchenTable.Infrastructure;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.Data.Sqlite;

namespace KitchenTable.Middleware;

public sealed class ApiExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext context,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var (status, detail) = exception switch
        {
            ApiException known => (known.StatusCode, known.Message),
            BadHttpRequestException badRequest => (badRequest.StatusCode, "Check the request format and values."),
            SqliteException { SqliteErrorCode: 19 } =>
                (409, "This item is still in use. Change the linked entries or meals first."),
            SqliteException { SqliteErrorCode: 5 or 6 } =>
                (503, "The database is busy. Try again in a moment."),
            _ => (500, "The server could not complete this request.")
        };

        await Results.Problem(statusCode: status, detail: detail).ExecuteAsync(context);
        return true;
    }
}
