using LifeRpg.Application.Dtos;
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
}
