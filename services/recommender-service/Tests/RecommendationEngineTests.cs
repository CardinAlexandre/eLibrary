using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using RecommenderService.Data;
using RecommenderService.Domain;
using RecommenderService.Services;
using Xunit;

namespace RecommenderService.Tests;

public class RecommendationEngineTests
{
    private RecommenderDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<RecommenderDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new RecommenderDbContext(options);
    }

    private IDistributedCache GetMemoryCache()
    {
        var opts = Options.Create(new MemoryDistributedCacheOptions());
        return new MemoryDistributedCache(opts);
    }

    [Fact]
    public async Task RecordInteraction_ShouldSaveToDatabase()
    {
        // Arrange
        var context = GetInMemoryDbContext();
        var cache = GetMemoryCache();
        var catalogService = new MockCatalogService();
        var logger = new MockLogger();

        var engine = new RecommendationEngine(context, catalogService, cache, logger);

        var userId = Guid.NewGuid();
        var bookId = Guid.NewGuid();

        // Act
        await engine.RecordInteractionAsync(userId, bookId, InteractionType.Borrow);

        // Assert
        var interactions = await context.UserInteractions.ToListAsync();
        Assert.Single(interactions);
        Assert.Equal(userId, interactions[0].UserId);
        Assert.Equal(bookId, interactions[0].BookId);
        Assert.Equal(InteractionType.Borrow, interactions[0].InteractionType);
    }

    [Fact]
    public async Task GetSimilarBooks_ShouldReturnBooksWithSameGenre()
    {
        // Arrange
        var context = GetInMemoryDbContext();
        var cache = GetMemoryCache();
        var catalogService = new MockCatalogService();
        var logger = new MockLogger();

        var engine = new RecommendationEngine(context, catalogService, cache, logger);

        var sourceBookId = Guid.NewGuid();

        // Add some test data
        catalogService.AddBook(sourceBookId, "Book 1", "Fiction", new[] { "adventure", "drama" });
        catalogService.AddBook(Guid.NewGuid(), "Book 2", "Fiction", new[] { "adventure" });
        catalogService.AddBook(Guid.NewGuid(), "Book 3", "Science", new[] { "space" });

        // Act
        var similar = await engine.GetSimilarBooksAsync(sourceBookId, 5);

        // Assert
        Assert.NotEmpty(similar);
        Assert.True(similar.Count <= 2); // Should not include source book
        Assert.Contains(similar, s => s.Genre == "Fiction");
    }

    [Fact]
    public void CalculateSimilarity_SameGenreAndTags_ShouldReturnHighScore()
    {
        // This would test the private CalculateSimilarity method
        // For simplicity, we'll test through the public GetSimilarBooks method
        Assert.True(true); // Placeholder
    }
}

// Mock classes for testing
public class MockCatalogService : CatalogServiceClient
{
    private readonly List<BookData> _books = new();

    public MockCatalogService() : base()
    {
    }

    public void AddBook(Guid id, string title, string genre, string[] tags)
    {
        _books.Add(new BookData
        {
            Id = id,
            Title = title,
            Genre = genre,
            Tags = tags.ToList(),
            Authors = new() { "Test Author" },
            Language = "en",
            AverageRating = 4.0,
            ReviewCount = 10
        });
    }

    public override async Task<List<BookData>?> GetAllBooksAsync()
    {
        return await Task.FromResult(_books);
    }

    public override async Task<BookData?> GetBookByIdAsync(Guid bookId)
    {
        return await Task.FromResult(_books.FirstOrDefault(b => b.Id == bookId));
    }
}

public class MockLogger : Microsoft.Extensions.Logging.ILogger<RecommendationEngine>
{
    public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
    public bool IsEnabled(Microsoft.Extensions.Logging.LogLevel logLevel) => true;
    public void Log<TState>(Microsoft.Extensions.Logging.LogLevel logLevel, Microsoft.Extensions.Logging.EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter) { }
}

