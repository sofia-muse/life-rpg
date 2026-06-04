using LifeRpg.Application.Dtos;
using LifeRpg.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LifeRpg.Api.Controllers;

[Authorize]
[Route("api/v1/sync")]
public class SyncController : ApiControllerBase
{
    private readonly SyncService _sync;

    public SyncController(SyncService sync) => _sync = sync;

    /// <summary>Idempotent batch sync of offline-queued mutations; returns a delta of server changes.</summary>
    [HttpPost]
    public async Task<IActionResult> Sync(SyncBatchRequest request) =>
        ToResponse(await _sync.SyncAsync(request));
}
