using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace FAMS.API.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    private readonly ILogger<NotificationHub> _logger;

    public NotificationHub(ILogger<NotificationHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var campusId = Context.User?.FindFirst("campus_id")?.Value;
        if (!string.IsNullOrEmpty(campusId))
            await Groups.AddToGroupAsync(Context.ConnectionId, $"campus_{campusId}");

        _logger.LogInformation("Client connected: {ConnectionId}", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Client disconnected: {ConnectionId}", Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }

    public async Task SendNotificationToCampus(string campusId, string message)
    {
        await Clients.Group($"campus_{campusId}").SendAsync("ReceiveNotification", message);
    }
}
