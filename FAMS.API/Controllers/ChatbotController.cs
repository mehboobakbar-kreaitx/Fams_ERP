using FAMS.Application.Common.Interfaces;
using FAMS.Application.Modules.Platform.Chatbot.Commands.SendChatMessage;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FAMS.API.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/chatbot")]
public class ChatbotController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public ChatbotController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    [HttpPost("message")]
    public async Task<IActionResult> SendMessage([FromBody] ChatbotMessageBody body)
    {
        if (_currentUser.CampusId is null) return Forbid();
        var role = _currentUser.Role ?? "Student";
        var command = new SendChatMessageCommand(body.Message, role, _currentUser.CampusId.Value);
        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(result.Value) : StatusCode(503, result);
    }
}

public record ChatbotMessageBody(string Message);

