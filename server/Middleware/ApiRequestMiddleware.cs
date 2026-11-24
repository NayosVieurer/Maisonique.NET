namespace KitchenTable.Middleware;

public sealed class ApiRequestMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var request = context.Request;

        if (request.Path.StartsWithSegments("/api"))
        {
            context.Response.Headers.CacheControl = "no-store";
            bool reading = HttpMethods.IsGet(request.Method) || HttpMethods.IsHead(request.Method);

            if (!reading && request.Headers["X-Kitchen-Table"] != "1")
            {
                await Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    detail: "Missing Kitchen Table request header."
                ).ExecuteAsync(context);
                return;
            }
        }

        await next(context);
    }
}
