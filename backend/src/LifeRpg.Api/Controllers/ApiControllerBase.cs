using LifeRpg.Application.Common;
using Microsoft.AspNetCore.Mvc;

namespace LifeRpg.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public abstract class ApiControllerBase : ControllerBase
{
    /// <summary>Maps a Result to the correct HTTP response, using ProblemDetails for failures.</summary>
    protected IActionResult ToResponse<T>(Result<T> result) =>
        result.Succeeded ? Ok(result.Value) : Problem(result);

    protected IActionResult ToResponse(Result result) =>
        result.Succeeded ? NoContent() : Problem(result);

    protected IActionResult ToCreated<T>(Result<T> result, string action) =>
        result.Succeeded ? CreatedAtAction(action, result.Value) : Problem(result);

    private IActionResult Problem(Result result)
    {
        var status = result.ErrorType switch
        {
            ErrorType.Validation => StatusCodes.Status400BadRequest,
            ErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
            ErrorType.Forbidden => StatusCodes.Status403Forbidden,
            ErrorType.NotFound => StatusCodes.Status404NotFound,
            ErrorType.Conflict => StatusCodes.Status409Conflict,
            _ => StatusCodes.Status400BadRequest,
        };
        return Problem(detail: result.Error, statusCode: status);
    }
}
