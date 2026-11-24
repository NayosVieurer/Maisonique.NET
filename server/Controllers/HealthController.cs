using KitchenTable.Models;
using Microsoft.AspNetCore.Mvc;

namespace KitchenTable.Controllers;

[ApiController]
[Route("api/health")]
public sealed class HealthController : ControllerBase
{
    [HttpGet]
    public ActionResult<HealthResponse> Get()
    {
        return Ok(new HealthResponse("ok"));
    }
}
