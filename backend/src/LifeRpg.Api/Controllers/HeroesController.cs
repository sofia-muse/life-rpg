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

    [HttpPost("me/rest-day")]
    public async Task<IActionResult> RestDay() => ToResponse(await _heroes.ClaimRewardAsync(true));

    [HttpPost("me/daily-reward")]
    public async Task<IActionResult> DailyReward() => ToResponse(await _heroes.ClaimRewardAsync(false));

    [HttpGet("me/completions")]
    public async Task<IActionResult> Completions() => ToResponse(await _heroes.GetCompletionsAsync());

    [HttpGet("me/weekly-cup")]
    public async Task<IActionResult> WeeklyCup() => ToResponse(await _heroes.GetWeeklyCupAsync());
}
