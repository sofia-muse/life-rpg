using LifeRpg.Application.Dtos;
using LifeRpg.Application.Services;
using LifeRpg.Domain.GameConfig;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LifeRpg.Api.Controllers;

public class SkillsController : ApiControllerBase
{
    /// <summary>The full static skill catalog (24 skills). Public — it's reference data.</summary>
    [HttpGet]
    [AllowAnonymous]
    public IActionResult Catalog() =>
        Ok(SkillDefinitions.All.Select(s => s.ToDto()).ToList());

    /// <summary>Forge a new AI-generated skill personalized to the current hero.</summary>
    [HttpPost("forge")]
    [Authorize]
    public async Task<IActionResult> Forge([FromServices] SkillForgeService forge) =>
        ToResponse(await forge.ForgeAsync());

    /// <summary>List the current hero's AI-forged skills.</summary>
    [HttpGet("forged")]
    [Authorize]
    public async Task<IActionResult> Forged([FromServices] SkillForgeService forge) =>
        ToResponse(await forge.ListAsync());
}
