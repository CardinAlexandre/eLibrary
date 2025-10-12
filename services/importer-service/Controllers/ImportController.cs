using ImporterService.Services;
using Microsoft.AspNetCore.Mvc;

namespace ImporterService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ImportController : ControllerBase
{
    private readonly GoogleBooksService _googleBooksService;
    private readonly CatalogServiceClient _catalogService;
    private readonly RabbitMQPublisher _rabbitMQPublisher;
    private readonly ILogger<ImportController> _logger;

    public ImportController(
        GoogleBooksService googleBooksService,
        CatalogServiceClient catalogService,
        RabbitMQPublisher rabbitMQPublisher,
        ILogger<ImportController> logger)
    {
        _googleBooksService = googleBooksService;
        _catalogService = catalogService;
        _rabbitMQPublisher = rabbitMQPublisher;
        _logger = logger;
    }

    [HttpPost("enrich")]
    public async Task<ActionResult<ImportResult>> ImportAndEnrich([FromBody] List<BookImportDto> books)
    {
        var successCount = 0;
        var failureCount = 0;
        var enrichedCount = 0;
        var errors = new List<string>();

        foreach (var book in books)
        {
            try
            {
                if (!string.IsNullOrEmpty(book.Isbn))
                {
                    var enrichmentData = await _googleBooksService.EnrichBookDataAsync(book.Isbn);

                    if (enrichmentData != null)
                    {
                        book.Description = string.IsNullOrEmpty(book.Description) ? enrichmentData.Description : book.Description;
                        book.CoverUrl = string.IsNullOrEmpty(book.CoverUrl) ? enrichmentData.ImageUrl : book.CoverUrl;

                        if (book.Authors == null || !book.Authors.Any())
                        {
                            book.Authors = enrichmentData.Authors;
                        }

                        if (book.Pages == 0)
                        {
                            book.Pages = enrichmentData.PageCount;
                        }

                        enrichedCount++;
                        _logger.LogInformation("Enriched book data for ISBN {ISBN}", book.Isbn);
                    }
                }

                var success = await _catalogService.CreateBookAsync(book);

                if (success)
                {
                    successCount++;
                    _rabbitMQPublisher.PublishBookImportedEvent(book);
                }
                else
                {
                    failureCount++;
                    errors.Add($"Failed to import '{book.Title}'");
                }
            }
            catch (Exception ex)
            {
                failureCount++;
                errors.Add($"Error importing '{book.Title}': {ex.Message}");
                _logger.LogError(ex, "Error importing book: {Title}", book.Title);
            }
        }

        return Ok(new ImportResult
        {
            TotalCount = books.Count,
            SuccessCount = successCount,
            FailureCount = failureCount,
            EnrichedCount = enrichedCount,
            Errors = errors
        });
    }
}

public class BookImportDto
{
    public string Title { get; set; } = string.Empty;
    public List<string>? Authors { get; set; }
    public string? Isbn { get; set; }
    public string? BookType { get; set; }
    public DateTime? PublishedDate { get; set; }
    public int Pages { get; set; }
    public string? Language { get; set; }
    public string? Genre { get; set; }
    public List<string>? Tags { get; set; }
    public string? Description { get; set; }
    public string? CoverUrl { get; set; }
    public Dictionary<string, object>? TypeSpecificData { get; set; }
}

public class ImportResult
{
    public int TotalCount { get; set; }
    public int SuccessCount { get; set; }
    public int FailureCount { get; set; }
    public int EnrichedCount { get; set; }
    public List<string> Errors { get; set; } = new();
}

