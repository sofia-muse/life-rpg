using LifeRpg.Application.Dtos;
using LifeRpg.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LifeRpg.Api.Controllers;

[Authorize]
public class GuidanceController : ApiControllerBase
{
    private readonly GuidanceService _guidance;

    public GuidanceController(GuidanceService guidance) => _guidance = guidance;

    [HttpGet("quests")]
    public async Task<IActionResult> SuggestedQuests() =>
        ToResponse(await _guidance.SuggestQuestsAsync());

    [HttpPost("boss-plan")]
    public async Task<IActionResult> BossPlan(BossQuestPlanRequest request) =>
        ToResponse(await _guidance.PlanBossQuestAsync(request));

    [HttpGet("chronicle")]
    public async Task<IActionResult> Chronicle() =>
        ToResponse(await _guidance.ChronicleAsync());
}
