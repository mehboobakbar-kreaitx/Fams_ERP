namespace FAMS.Application.Common.Interfaces;

/// <summary>
/// Abstraction over the real-time push channel (SignalR in production). Keeps the
/// application layer free from a hard dependency on Microsoft.AspNetCore.SignalR.
/// </summary>
public interface INotificationHub
{
    Task SendToUserAsync(string userId, string title, string body, string? deeplink = null, CancellationToken ct = default);
    Task SendToCampusAsync(Guid campusId, string title, string body, string? deeplink = null, CancellationToken ct = default);
    Task BroadcastAsync(string title, string body, string? deeplink = null, CancellationToken ct = default);
}
