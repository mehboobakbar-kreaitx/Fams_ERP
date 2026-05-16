namespace FAMS.Application.Common.Interfaces;

public interface IAiChatbotService
{
    Task<string> GetResponseAsync(string userMessage, string userRole, Guid campusId, CancellationToken ct = default);
}
