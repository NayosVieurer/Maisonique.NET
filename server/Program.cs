using KitchenTable.Configuration;
using KitchenTable.Infrastructure.Interfaces;
using KitchenTable.Middleware;

var builder = WebApplication.CreateBuilder(args);
builder.AddKitchenTable();

var app = builder.Build();
app.Services.GetRequiredService<IDatabase>().Migrate();

app.UseExceptionHandler();
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseRouting();
app.UseCors();
app.UseMiddleware<ApiRequestMiddleware>();

app.MapControllers();
app.Run();
