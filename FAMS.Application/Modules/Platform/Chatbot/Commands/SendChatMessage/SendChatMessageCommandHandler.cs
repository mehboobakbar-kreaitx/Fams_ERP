using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Models;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FAMS.Application.Modules.Platform.Chatbot.Commands.SendChatMessage;

public class SendChatMessageCommandHandler : IRequestHandler<SendChatMessageCommand, Result<ChatMessageResponse>>
{
    private readonly IAiChatbotService _chatbot;
    private readonly ILogger<SendChatMessageCommandHandler> _logger;

    public SendChatMessageCommandHandler(IAiChatbotService chatbot, ILogger<SendChatMessageCommandHandler> logger)
    {
        _chatbot = chatbot;
        _logger = logger;
    }

    public async Task<Result<ChatMessageResponse>> Handle(SendChatMessageCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var reply = await _chatbot.GetResponseAsync(request.Message, request.UserRole, request.CampusId, cancellationToken);
            return Result<ChatMessageResponse>.Success(new ChatMessageResponse(reply, DateTime.UtcNow));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Chatbot service failed for role {Role}, campus {CampusId}", request.UserRole, request.CampusId);
            return Result<ChatMessageResponse>.Failure("The assistant is temporarily unavailable. Please try again later.");
        }
    }
}
