using FAMS.Application.Common.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace FAMS.API.Hubs;

/// <summary>
/// SignalR-backed implementation of the application layer's <see cref="INotificationHub"/> abstraction.
/// Pushes events to clients connected to <see cref="NotificationHub"/>.
/// </summary>
public class SignalRNotificationHub : INotificationHub
{
    private readonly IHubContext<NotificationHub> _hub;

    public SignalRNotificationHub(IHubContext<NotificationHub> hub) => _hub = hub;

    public Task SendToUserAsync(string userId, string title, string body, string? deeplink = null, CancellationToken ct = default)
        => _hub.Clients.User(userId).SendAsync("notification", new { title, body, deeplink, ts = DateTime.UtcNow }, ct);

    public Task SendToCampusAsync(Guid campusId, string title, string body, string? deeplink = null, CancellationToken ct = default)
        => _hub.Clients.Group($"campus_{campusId}").SendAsync("notification", new { title, body, deeplink, ts = DateTime.UtcNow }, ct);

    public Task BroadcastAsync(string title, string body, string? deeplink = null, CancellationToken ct = default)
        => _hub.Clients.All.SendAsync("notification", new { title, body, deeplink, ts = DateTime.UtcNow }, ct);
}
