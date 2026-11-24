using KitchenTable.Infrastructure;
using KitchenTable.Infrastructure.Interfaces;
using KitchenTable.Middleware;
using KitchenTable.Services.Concrete;
using KitchenTable.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace KitchenTable.Configuration;

internal static class ServiceRegistration
{
    public static void AddKitchenTable(this WebApplicationBuilder builder)
    {
        var services = builder.Services;
        var configuration = builder.Configuration;
        var path = configuration["KitchenTable:DatabasePath"] ?? "data/kitchen-table.db";
        var zone = configuration["KitchenTable:TimeZone"] ?? "Europe/London";

        services.AddSingleton<IDatabase>(_ => new Database(Path.Combine(builder.Environment.ContentRootPath, path)));
        services.AddSingleton(TimeZoneInfo.FindSystemTimeZoneById(zone));

        services.AddScoped<IPersonService, PersonService>();
        services.AddScoped<IEntryService, EntryService>();
        services.AddScoped<IRecipeService, RecipeService>();
        services.AddScoped<IMealService, MealService>();
        services.AddScoped<IShoppingService, ShoppingService>();
        services.AddScoped<IWeekService, WeekService>();

        services.AddControllers(options => options.SuppressImplicitRequiredAttributeForNonNullableReferenceTypes = true)
            .ConfigureApiBehaviorOptions(options =>
            {
                options.InvalidModelStateResponseFactory = _ => new BadRequestObjectResult(new ProblemDetails
                {
                    Status = StatusCodes.Status400BadRequest,
                    Detail = "Check the request format and values."
                });
            });

        services.AddExceptionHandler<ApiExceptionHandler>();
        services.AddProblemDetails();
        builder.WebHost.ConfigureKestrel(options => options.Limits.MaxRequestBodySize = 1024 * 1024);

        var devOrigin = configuration["KitchenTable:DevOrigin"];
        services.AddCors(options => options.AddDefaultPolicy(policy =>
        {
            if (builder.Environment.IsDevelopment() && !string.IsNullOrWhiteSpace(devOrigin))
            {
                policy.WithOrigins(devOrigin)
                    .WithMethods("GET", "PUT", "PATCH", "DELETE")
                    .WithHeaders("Content-Type", "X-Kitchen-Table");
            }
        }));
    }
}
