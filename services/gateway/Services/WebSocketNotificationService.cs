using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;

namespace Gateway.Services;

public class WebSocketNotificationService
{
    private readonly ConcurrentDictionary<string, WebSocket> _connections = new();
    private readonly ILogger<WebSocketNotificationService> _logger;

    public WebSocketNotificationService(ILogger<WebSocketNotificationService> logger)
    {
        _logger = logger;
    }

    public async Task HandleWebSocketAsync(HttpContext context, string connectionId)
    {
        if (!context.WebSockets.IsWebSocketRequest)
        {
            context.Response.StatusCode = 400;
            return;
        }

        var webSocket = await context.WebSockets.AcceptWebSocketAsync();
        _connections.TryAdd(connectionId, webSocket);
        _logger.LogInformation("WebSocket connection established: {ConnectionId}", connectionId);

        try
        {
            await ReceiveMessagesAsync(webSocket, connectionId);
        }
        finally
        {
            _connections.TryRemove(connectionId, out _);
            if (webSocket.State == WebSocketState.Open)
            {
                await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closing", CancellationToken.None);
            }
            webSocket.Dispose();
            _logger.LogInformation("WebSocket connection closed: {ConnectionId}", connectionId);
        }
    }

    private async Task ReceiveMessagesAsync(WebSocket webSocket, string connectionId)
    {
        var buffer = new byte[1024 * 4];

        while (webSocket.State == WebSocketState.Open)
        {
            var result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);

            if (result.MessageType == WebSocketMessageType.Close)
            {
                break;
            }

            if (result.MessageType == WebSocketMessageType.Text)
            {
                var message = Encoding.UTF8.GetString(buffer, 0, result.Count);
                _logger.LogInformation("Received message from {ConnectionId}: {Message}", connectionId, message);

                // Echo back or handle ping/pong
                if (message == "ping")
                {
                    await SendMessageAsync(connectionId, "pong");
                }
            }
        }
    }

    public async Task SendMessageAsync(string connectionId, string message)
    {
        if (_connections.TryGetValue(connectionId, out var webSocket) && webSocket.State == WebSocketState.Open)
        {
            var buffer = Encoding.UTF8.GetBytes(message);
            await webSocket.SendAsync(new ArraySegment<byte>(buffer), WebSocketMessageType.Text, true, CancellationToken.None);
            _logger.LogInformation("Sent message to {ConnectionId}: {Message}", connectionId, message);
        }
    }

    public async Task BroadcastAsync(object notification)
    {
        var message = JsonSerializer.Serialize(notification);
        var buffer = Encoding.UTF8.GetBytes(message);

        var tasks = _connections.Values
            .Where(ws => ws.State == WebSocketState.Open)
            .Select(ws => ws.SendAsync(new ArraySegment<byte>(buffer), WebSocketMessageType.Text, true, CancellationToken.None));

        await Task.WhenAll(tasks);
        _logger.LogInformation("Broadcasted message to {Count} connections", _connections.Count);
    }

    public async Task SendToUserAsync(string userId, object notification)
    {
        var message = JsonSerializer.Serialize(notification);
        var buffer = Encoding.UTF8.GetBytes(message);

        // Dans une vraie implémentation, on maintiendrait un mapping userId -> connectionId
        // Pour la démo, on broadcast à tous
        var tasks = _connections.Values
            .Where(ws => ws.State == WebSocketState.Open)
            .Select(ws => ws.SendAsync(new ArraySegment<byte>(buffer), WebSocketMessageType.Text, true, CancellationToken.None));

        await Task.WhenAll(tasks);
        _logger.LogInformation("Sent notification to user {UserId}", userId);
    }

    public int GetActiveConnectionsCount() => _connections.Count(kvp => kvp.Value.State == WebSocketState.Open);
}

