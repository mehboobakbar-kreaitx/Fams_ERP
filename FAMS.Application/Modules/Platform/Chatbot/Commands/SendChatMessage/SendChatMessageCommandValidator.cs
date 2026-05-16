using FluentValidation;

namespace FAMS.Application.Modules.Platform.Chatbot.Commands.SendChatMessage;

public class SendChatMessageCommandValidator : AbstractValidator<SendChatMessageCommand>
{
    public SendChatMessageCommandValidator()
    {
        RuleFor(x => x.Message).NotEmpty().MaximumLength(4000);
        RuleFor(x => x.UserRole).NotEmpty();
        RuleFor(x => x.CampusId).NotEmpty();
    }
}
