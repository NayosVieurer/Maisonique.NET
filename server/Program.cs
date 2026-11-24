using KitchenTable;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.Data.Sqlite;

var builder = WebApplication.CreateBuilder(args);
var path = builder.Configuration["KitchenTable:DatabasePath"] ?? "data/kitchen-table.db";
var database = new Database(Path.Combine(builder.Environment.ContentRootPath, path));
database.Migrate();
builder.Services.AddSingleton(database);
var zone = TimeZoneInfo.FindSystemTimeZoneById(builder.Configuration["KitchenTable:TimeZone"] ?? "Europe/London");
builder.Services.AddSingleton(zone);
builder.WebHost.ConfigureKestrel(o => o.Limits.MaxRequestBodySize = 1024 * 1024);
var devOrigin = builder.Configuration["KitchenTable:DevOrigin"];
builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
{
    if (builder.Environment.IsDevelopment() && !string.IsNullOrWhiteSpace(devOrigin))
        policy.WithOrigins(devOrigin).WithMethods("GET", "PUT", "PATCH", "DELETE")
            .WithHeaders("Content-Type", "X-Kitchen-Table");
}));

var app = builder.Build();
app.UseExceptionHandler(error => error.Run(async context =>
{
    var exception = context.Features.Get<IExceptionHandlerFeature>()?.Error;
    var (status, detail) = exception switch
    {
        Fault f => (f.Status, f.Message),
        BadHttpRequestException b => (b.StatusCode, "Check the request format and values."),
        SqliteException { SqliteErrorCode: 19 } => (409, "This item is still in use. Change the linked entries or meals first."),
        SqliteException { SqliteErrorCode: 5 or 6 } => (503, "The database is busy. Try again in a moment."),
        _ => (500, "The server could not complete this request.")
    };
    await Results.Problem(statusCode: status, detail: detail).ExecuteAsync(context);
}));
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseRouting();
app.UseCors();
app.Use(async (context, next) =>
{
    if (context.Request.Path.StartsWithSegments("/api"))
    {
        context.Response.Headers.CacheControl = "no-store";
        if (!HttpMethods.IsGet(context.Request.Method) && !HttpMethods.IsHead(context.Request.Method) &&
            context.Request.Headers["X-Kitchen-Table"] != "1")
        {
            await Results.Problem(statusCode: 400, detail: "Missing Kitchen Table request header.").ExecuteAsync(context);
            return;
        }
    }
    await next();
});

var api = app.MapGroup("/api");
api.MapGet("/health", () => Results.Ok(new { status = "ok" }));
api.MapGet("/week", (string? start, Database db, TimeZoneInfo householdZone) =>
{
    var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, householdZone).DateTime);
    var week = start == null ? Rules.Monday(today) : Rules.Week(start);
    return db.Read(s =>
    {
        var recipes = Recipes.List(s);
        var meals = Planning.Meals(s, week);
        return new { start = Rules.Iso(week), today = Rules.Iso(today), timeZone = householdZone.Id,
            people = Calendar.People(s), recipes, entries = Calendar.Entries(s, week), meals,
            shopping = Shopping.Items(s, week, meals, recipes) };
    });
});

api.MapPut("/people/{id:guid}", (Guid id, PersonInput input, Database db) =>
    Commit(db, s => Calendar.SavePerson(s, Rules.Id(id), input)));
api.MapPut("/recipes/{id:guid}", (Guid id, RecipeInput input, Database db) =>
    Commit(db, s => Recipes.Save(s, Rules.Id(id), input)));
api.MapPut("/entries/{id:guid}", (Guid id, EntryInput input, Database db) =>
    Commit(db, s => Calendar.SaveEntry(s, Rules.Id(id), input)));
api.MapPatch("/entries/{id:guid}/done", (Guid id, DoneInput input, Database db) =>
    Commit(db, s => Calendar.SetChore(s, Rules.Id(id), input.Required())));
api.MapPut("/meals/{id:guid}", (Guid id, MealInput input, Database db) =>
    Commit(db, s => Planning.Save(s, Rules.Id(id), input)));
foreach (string table in new[] { "people", "recipes", "entries", "meals" })
{
    api.MapDelete("/" + table + "/{id:guid}", (Guid id, int version, Database db) =>
        Commit(db, s => s.Delete(table, Rules.Id(id), version)));
}

api.MapPut("/shopping/{week}/extras/{id:guid}", (string week, Guid id, ExtraInput input, Database db) =>
    Commit(db, s => Shopping.AddExtra(s, Rules.Week(week), Rules.Id(id), input)));
api.MapDelete("/shopping/{week}/extras/{id:guid}", (string week, Guid id, Database db) =>
    Commit(db, s => s.Exec("DELETE FROM extras WHERE week=$w AND id=$id",
        ("$w", Rules.Iso(Rules.Week(week))), ("$id", Rules.Id(id)))));
api.MapPatch("/shopping/{week}/{id}/done", (string week, string id, DoneInput input, Database db) =>
    Commit(db, s => Shopping.SetCheck(s, Rules.Week(week), id, input.Required())));

app.Run();

static IResult Commit(Database db, Action<Session> action)
{
    db.Write(action);
    return Results.NoContent();
}
