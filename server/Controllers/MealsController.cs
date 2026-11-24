using KitchenTable.Infrastructure;
using KitchenTable.Models;
using KitchenTable.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace KitchenTable.Controllers;

[ApiController]
[Route("api/meals")]
public sealed class MealsController(IMealService service) : ControllerBase
{
    [HttpPut("{id:guid}")]
    public IActionResult Save([FromRoute] Guid id, [FromBody] MealInput input)
    {
        service.Save(id, input);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public IActionResult Delete([FromRoute] Guid id)
    {
        int version = Request.Query.RequiredVersion();
        service.Delete(id, version);
        return NoContent();
    }
}
