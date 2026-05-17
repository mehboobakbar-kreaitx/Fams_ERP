using FAMS.Application.Common.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FAMS.API.Controllers;

[ApiController]
[Authorize(Roles = "SystemAdmin,Principal,AcademicCoordinator")]
[Route("api/v1/[controller]")]
public class LmsController : ControllerBase
{
    private readonly ILmsService _lms;
    private readonly ICurrentUserService _currentUser;

    public LmsController(ILmsService lms, ICurrentUserService currentUser)
    {
        _lms = lms;
        _currentUser = currentUser;
    }

    [HttpGet("status")]
    public async Task<IActionResult> Status(CancellationToken ct)
    {
        var status = await _lms.GetStatusAsync(ct);
        return Ok(status);
    }

    [HttpPost("sync")]
    public async Task<IActionResult> Sync(CancellationToken ct)
    {
        if (_currentUser.CampusId is null) return Forbid();
        var result = await _lms.SyncCampusAsync(_currentUser.CampusId.Value, ct);
        return Ok(result);
    }
}
