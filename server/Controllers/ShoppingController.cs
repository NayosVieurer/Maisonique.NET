using KitchenTable.Models;
using KitchenTable.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace KitchenTable.Controllers;

[ApiController]
[Route("api/shopping/{week}")]
public sealed class ShoppingController(IShoppingService service) : ControllerBase
{
    [HttpPut("extras/{id:guid}")]
    public IActionResult AddExtra([FromRoute] string week, [FromRoute] Guid id, [FromBody] ExtraInput input)
    {
        service.AddExtra(week, id, input);
        return NoContent();
    }

    [HttpDelete("extras/{id:guid}")]
    public IActionResult DeleteExtra([FromRoute] string week, [FromRoute] Guid id)
    {
        service.DeleteExtra(week, id);
        return NoContent();
    }

    [HttpPatch("{id}/done")]
    public IActionResult SetDone([FromRoute] string week, [FromRoute] string id, [FromBody] DoneInput input)
    {
        service.SetDone(week, id, input);
        return NoContent();
    }
}
