using CatalogService.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;

namespace CatalogService.Features.Books.Commands;

public record ClearBooksCommand : IRequest<int>;

public class ClearBooksCommandHandler : IRequestHandler<ClearBooksCommand, int>
{
    private readonly CatalogDbContext _context;
    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<ClearBooksCommandHandler> _logger;

    public ClearBooksCommandHandler(
        CatalogDbContext context, 
        IConnectionMultiplexer redis,
        ILogger<ClearBooksCommandHandler> logger)
    {
        _context = context;
        _redis = redis;
        _logger = logger;
    }

    public async Task<int> Handle(ClearBooksCommand request, CancellationToken cancellationToken)
    {
        var count = await _context.Books.CountAsync(cancellationToken);
        
        if (count == 0)
        {
            return 0;
        }

        _context.Books.RemoveRange(_context.Books);
        await _context.SaveChangesAsync(cancellationToken);

        // Clear all Redis cache keys related to books
        try
        {
            var db = _redis.GetDatabase();
            var server = _redis.GetServer(_redis.GetEndPoints().First());
            
            // Delete all keys that start with "books:"
            var keysToDelete = server.Keys(pattern: "books:*").ToArray();
            if (keysToDelete.Any())
            {
                await db.KeyDeleteAsync(keysToDelete);
                _logger.LogInformation("Cleared {Count} Redis cache keys", keysToDelete.Length);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to clear Redis cache, but continuing...");
        }

        _logger.LogInformation("Cleared {Count} books from database", count);
        
        return count;
    }
}

