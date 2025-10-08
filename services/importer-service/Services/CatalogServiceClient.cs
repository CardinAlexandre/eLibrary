using System.Text;
using System.Text.Json;

namespace ImporterService.Services;

public class CatalogServiceClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<CatalogServiceClient> _logger;

    public CatalogServiceClient(HttpClient httpClient, IConfiguration configuration, ILogger<CatalogServiceClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;

        var baseUrl = configuration["CatalogService:BaseUrl"] ?? "http://catalog-service:80";
        _httpClient.BaseAddress = new Uri(baseUrl);
    }

    public async Task<bool> CreateBookAsync(object bookDto)
    {
        try
        {
            var json = JsonSerializer.Serialize(bookDto);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("/api/catalog/books", content);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogError("Failed to create book in catalog: {Error}", error);
                return false;
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating book in catalog");
            return false;
        }
    }
}

