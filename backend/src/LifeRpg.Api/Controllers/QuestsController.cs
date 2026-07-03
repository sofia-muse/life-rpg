using LifeRpg.Application.Dtos;
using LifeRpg.Application.Services;
using LifeRpg.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LifeRpg.Api.Controllers;

[Authorize]
public class QuestsController : ApiControllerBase
{
    private readonly QuestService _quests;

    public QuestsController(QuestService quests) => _quests = quests;

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] QuestType? type, [FromQuery] bool? active) =>
        ToResponse(await _quests.ListAsync(type, active));

    [HttpPost]
    public async Task<IActionResult> Create(CreateQuestRequest request) =>
        ToResponse(await _quests.CreateAsync(request));

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id) =>
        ToResponse(await _quests.DeleteAsync(id));

    [HttpPost("{id:guid}/boss-step")]
    public async Task<IActionResult> AdvanceBossStep(Guid id) =>
        ToResponse(await _quests.AdvanceBossStepAsync(id));

    /// <summary>Server-authoritative completion: XP/level/class/skills are recomputed server-side.</summary>
    [HttpPost("{id:guid}/complete")]
    public async Task<IActionResult> Complete(Guid id) =>
        ToResponse(await _quests.CompleteAsync(id));
}
