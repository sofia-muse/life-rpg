using LifeRpg.Application.Dtos;
using LifeRpg.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LifeRpg.Api.Controllers;

[Authorize]
public class RaidsController : ApiControllerBase
{
    private readonly RaidService _raids;

    public RaidsController(RaidService raids) => _raids = raids;

    [HttpGet]
    public async Task<IActionResult> ListMine() =>
        ToResponse(await _raids.ListMineAsync());

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id) =>
        ToResponse(await _raids.GetAsync(id));

    [HttpPost]
    public async Task<IActionResult> Create(CreateRaidRequest request) =>
        ToResponse(await _raids.CreateAsync(request));

    [HttpPost("join")]
    public async Task<IActionResult> Join(JoinRaidRequest request) =>
        ToResponse(await _raids.JoinAsync(request));

    [HttpPost("{id:guid}/contribute")]
    public async Task<IActionResult> Contribute(Guid id, ContributeRaidRequest request) =>
        ToResponse(await _raids.ContributeAsync(id, request));
}
