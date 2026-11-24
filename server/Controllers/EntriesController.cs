using KitchenTable.Infrastructure;
using KitchenTable.Models;
using KitchenTable.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace KitchenTable.Controllers;

[ApiController]
[Route("api/entries")]
public sealed class EntriesController(IEntryService service) : ControllerBase
{
    [HttpPut("{id:guid}")]
    public IActionResult Save([FromRoute] Guid id, [FromBody] EntryInput input)
    {
        service.Save(id, input);
        return NoContent();
    }

    [HttpPatch("{id:guid}/done")]
    public IActionResult SetDone([FromRoute] Guid id, [FromBody] DoneInput input)
    {
        service.SetDone(id, input);
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
