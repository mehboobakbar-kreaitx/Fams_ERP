using FAMS.Application.Common.Interfaces;
using FAMS.Application.Modules.Auth.Commands.ChangePassword;
using FAMS.Application.Modules.Auth.Commands.Login;
using FAMS.Application.Modules.Auth.Commands.Logout;
using FAMS.Application.Modules.Auth.Commands.RefreshToken;
using FAMS.Application.Modules.Auth.Commands.ResetPassword;
using FAMS.Application.Modules.Auth.Commands.SetupMfa;
using FAMS.Application.Modules.Auth.Commands.VerifyMfa;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace FAMS.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[EnableRateLimiting("auth")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public AuthController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginCommand command)
    {
        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(result.Value) : Unauthorized(new { error = result.Error });
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenCommand command)
    {
        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(result.Value) : Unauthorized(new { error = result.Error });
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        if (_currentUser.UserId is null) return Unauthorized();
        await _mediator.Send(new LogoutCommand(_currentUser.UserId));
        return NoContent();
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordBody body)
    {
        if (_currentUser.UserId is null) return Unauthorized();
        var result = await _mediator.Send(new ChangePasswordCommand(_currentUser.UserId, body.OldPassword, body.NewPassword));
        return result.IsSuccess ? NoContent() : BadRequest(result);
    }

    [HttpPost("mfa/setup")]
    [Authorize]
    public async Task<IActionResult> SetupMfa()
    {
        if (_currentUser.UserId is null) return Unauthorized();
        var result = await _mediator.Send(new SetupMfaCommand(_currentUser.UserId));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result);
    }

    [HttpPost("mfa/verify")]
    [Authorize]
    public async Task<IActionResult> VerifyMfa([FromBody] VerifyMfaBody body)
    {
        if (_currentUser.UserId is null) return Unauthorized();
        var result = await _mediator.Send(new VerifyMfaCommand(_currentUser.UserId, body.Code));
        return result.IsSuccess ? NoContent() : BadRequest(result);
    }

    [HttpPost("password/forgot")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordBody body)
    {
        await _mediator.Send(new RequestPasswordResetCommand(body.Email));
        return Ok(new { message = "If the email exists, a reset link has been sent." });
    }

    [HttpPost("password/reset")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordCommand command)
    {
        var result = await _mediator.Send(command);
        return result.IsSuccess ? NoContent() : BadRequest(result);
    }
}

public record ChangePasswordBody(string OldPassword, string NewPassword);
public record VerifyMfaBody(string Code);
public record ForgotPasswordBody(string Email);

