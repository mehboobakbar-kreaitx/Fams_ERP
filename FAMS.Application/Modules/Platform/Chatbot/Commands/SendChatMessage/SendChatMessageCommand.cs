using FAMS.Application.Common.Models;
using MediatR;

namespace FAMS.Application.Modules.Platform.Chatbot.Commands.SendChatMessage;

public record SendChatMessageCommand(
    string Message,
    string UserRole,
    Guid CampusId) : IRequest<Result<ChatMessageResponse>>;

public record ChatMessageResponse(string Reply, DateTime RespondedAt);
