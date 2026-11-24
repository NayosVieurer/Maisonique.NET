using KitchenTable.Infrastructure;
using KitchenTable.Models;
using KitchenTable.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace KitchenTable.Controllers;

[ApiController]
[Route("api/week")]
public sealed class WeekController(IWeekService service) : ControllerBase
{
    [HttpGet]
    public ActionResult<WeekSnapshot> Get()
    {
        string? start = Request.Query.OptionalValue("start");
        return Ok(service.GetWeek(start));
    }
}
