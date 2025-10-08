using System.Text.Json;

namespace ImporterService.Services;

public class GoogleBooksService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GoogleBooksService> _logger;

    public GoogleBooksService(HttpClient httpClient, IConfiguration configuration, ILogger<GoogleBooksService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;

        var baseUrl = configuration["GoogleBooksApi:BaseUrl"] ?? "https://www.googleapis.com/books/v1";
        _httpClient.BaseAddress = new Uri(baseUrl);
    }

    public async Task<BookEnrichmentData?> EnrichBookDataAsync(string isbn)
    {
        try
        {
            var apiKey = _configuration["GoogleBooksApi:ApiKey"];
            var url = $"/volumes?q=isbn:{isbn}";

            if (!string.IsNullOrEmpty(apiKey) && apiKey != "YOUR_API_KEY_HERE")
            {
                url += $"&key={apiKey}";
            }

            var response = await _httpClient.GetAsync(url);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to enrich book data for ISBN {ISBN}: {StatusCode}", isbn, response.StatusCode);
                return null;
            }

            var content = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<GoogleBooksResponse>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (result?.Items == null || !result.Items.Any())
            {
                return null;
            }

            var volumeInfo = result.Items[0].VolumeInfo;

            return new BookEnrichmentData
            {
                Title = volumeInfo?.Title ?? "",
                Authors = volumeInfo?.Authors ?? new List<string>(),
                Description = volumeInfo?.Description ?? "",
                Publisher = volumeInfo?.Publisher ?? "",
                PublishedDate = volumeInfo?.PublishedDate ?? "",
                PageCount = volumeInfo?.PageCount ?? 0,
                Categories = volumeInfo?.Categories ?? new List<string>(),
                ImageUrl = volumeInfo?.ImageLinks?.Thumbnail ?? "",
                Language = volumeInfo?.Language ?? "en"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error enriching book data for ISBN {ISBN}", isbn);
            return null;
        }
    }
}

public class GoogleBooksResponse
{
    public List<GoogleBookItem>? Items { get; set; }
}

public class GoogleBookItem
{
    public VolumeInfo? VolumeInfo { get; set; }
}

public class VolumeInfo
{
    public string? Title { get; set; }
    public List<string>? Authors { get; set; }
    public string? Description { get; set; }
    public string? Publisher { get; set; }
    public string? PublishedDate { get; set; }
    public int? PageCount { get; set; }
    public List<string>? Categories { get; set; }
    public ImageLinks? ImageLinks { get; set; }
    public string? Language { get; set; }
}

public class ImageLinks
{
    public string? Thumbnail { get; set; }
}

public class BookEnrichmentData
{
    public string Title { get; set; } = string.Empty;
    public List<string> Authors { get; set; } = new();
    public string Description { get; set; } = string.Empty;
    public string Publisher { get; set; } = string.Empty;
    public string PublishedDate { get; set; } = string.Empty;
    public int PageCount { get; set; }
    public List<string> Categories { get; set; } = new();
    public string ImageUrl { get; set; } = string.Empty;
    public string Language { get; set; } = string.Empty;
}

