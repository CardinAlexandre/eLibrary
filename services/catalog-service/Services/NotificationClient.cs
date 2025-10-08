using System.Text;
using System.Text.Json;

namespace CatalogService.Services;

public class NotificationClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<NotificationClient> _logger;

    public NotificationClient(HttpClient httpClient, IConfiguration configuration, ILogger<NotificationClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;

        var gatewayUrl = configuration["GatewayService:BaseUrl"] ?? "http://gateway:80";
        _httpClient.BaseAddress = new Uri(gatewayUrl);
    }

    public async Task SendNotificationAsync(string type, string message)
    {
        try
        {
            var notification = new
            {
                Type = type,
                Message = message
            };

            var json = JsonSerializer.Serialize(notification);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("/api/notifications/send", content);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Notification sent: {Type} - {Message}", type, message);
            }
            else
            {
                _logger.LogWarning("Failed to send notification: {StatusCode}", response.StatusCode);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending notification");
        }
    }

    public async Task NotifyBookCreatedAsync(string bookTitle)
    {
        await SendNotificationAsync("book.created", $"Nouveau livre ajouté : {bookTitle}");
    }

    public async Task NotifyBookBorrowedAsync(string bookTitle, string userName)
    {
        await SendNotificationAsync("book.borrowed", $"{userName} a emprunté '{bookTitle}'");
    }

    public async Task NotifyBookReturnedAsync(string bookTitle)
    {
        await SendNotificationAsync("book.returned", $"'{bookTitle}' est de nouveau disponible");
    }

    public async Task NotifyReviewAddedAsync(string bookTitle, int rating)
    {
        await SendNotificationAsync("review.added", $"Nouvel avis ({rating}⭐) pour '{bookTitle}'");
    }
}

