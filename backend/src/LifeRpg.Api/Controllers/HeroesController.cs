using LifeRpg.Application.Dtos;
using LifeRpg.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LifeRpg.Api.Controllers;

[Authorize]
public class HeroesController : ApiControllerBase
{
    private readonly HeroService _heroes;

    public HeroesController(HeroService heroes) => _heroes = heroes;

    [HttpPost]
    public async Task<IActionResult> Create(CreateHeroRequest request) =>
        ToResponse(await _heroes.CreateAsync(request));

    [HttpGet("me")]
    public async Task<IActionResult> Me() => ToResponse(await _heroes.GetMineAsync());

    [HttpPut("me/appearance")]
    public async Task<IActionResult> UpdateAppearance(UpdateAppearanceRequest request) =>
        ToResponse(await _heroes.UpdateAppearanceAsync(request));

    [HttpDelete("me")]
    public async Task<IActionResult> DeleteMine() => ToResponse(await _heroes.DeleteAsync());

    [HttpGet("me/stats")]
    public async Task<IActionResult> Stats() => ToResponse(await _heroes.GetStatsAsync());

    [HttpGet("me/weekly-cup")]
    public async Task<IActionResult> WeeklyCup() => ToResponse(await _heroes.GetWeeklyCupAsync());

    [HttpPost("me/rest")]
    public async Task<IActionResult> Rest() => ToResponse(await _heroes.TakeRestAsync());

    [HttpPost("me/respec")]
    public async Task<IActionResult> Respec(RespecRequest request) =>
        ToResponse(await _heroes.RespecAsync(request.Stat));

    [HttpPost("me/weekly-reward")]
    public async Task<IActionResult> ClaimWeeklyReward() =>
        ToResponse(await _heroes.ClaimWeeklyRewardAsync());
}
