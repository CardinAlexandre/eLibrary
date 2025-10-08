using System.Text.Json;

namespace RecommenderService.Services;

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

    // Constructor for testing/mocking
    protected CatalogServiceClient()
    {
        _httpClient = null!;
        _logger = null!;
    }

    public virtual async Task<List<BookData>?> GetAllBooksAsync()
    {
        try
        {
            var response = await _httpClient.GetAsync("/api/catalog/books?pageSize=1000");

            if (!response.IsSuccessStatusCode)
            {
                _logger?.LogWarning("Failed to fetch books: {StatusCode}", response.StatusCode);
                return null;
            }

            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<PagedResult>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            return result?.Items;
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Error fetching books from catalog service");
            return null;
        }
    }

    public virtual async Task<BookData?> GetBookByIdAsync(Guid bookId)
    {
        try
        {
            var response = await _httpClient.GetAsync($"/api/catalog/books/{bookId}");

            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<BookData>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Error fetching book {BookId}", bookId);
            return null;
        }
    }
}

public class PagedResult
{
    public List<BookData> Items { get; set; } = new();
    public int TotalCount { get; set; }
}

public class BookData
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public List<string> Authors { get; set; } = new();
    public string Genre { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = new();
    public string Language { get; set; } = string.Empty;
    public string CoverUrl { get; set; } = string.Empty;
    public double AverageRating { get; set; }
    public int ReviewCount { get; set; }
}

