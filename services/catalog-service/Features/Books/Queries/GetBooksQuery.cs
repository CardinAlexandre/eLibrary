using CatalogService.Data;
using CatalogService.Domain.Entities;
using CatalogService.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

namespace CatalogService.Features.Books.Queries;

public record GetBooksQuery(int Page = 1, int PageSize = 20, string? Genre = null, string? Language = null, string? BookType = null) : IRequest<PagedResult<BookDto>>;

public class GetBooksQueryHandler : IRequestHandler<GetBooksQuery, PagedResult<BookDto>>
{
    private readonly CatalogDbContext _context;
    private readonly IDistributedCache _cache;

    public GetBooksQueryHandler(CatalogDbContext context, IDistributedCache cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<PagedResult<BookDto>> Handle(GetBooksQuery request, CancellationToken cancellationToken)
    {
        var cacheKey = $"books:{request.Page}:{request.PageSize}:{request.Genre}:{request.Language}:{request.BookType}";

        var cachedResult = await _cache.GetStringAsync(cacheKey, cancellationToken);
        if (cachedResult != null)
        {
            return JsonSerializer.Deserialize<PagedResult<BookDto>>(cachedResult) ?? new PagedResult<BookDto>();
        }

        var query = _context.Books
            .Include(b => b.Reviews)
            .AsQueryable();

        if (!string.IsNullOrEmpty(request.Genre))
        {
            query = query.Where(b => b.Genre == request.Genre);
        }

        if (!string.IsNullOrEmpty(request.Language))
        {
            query = query.Where(b => b.Language == request.Language);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var books = await query
            .OrderByDescending(b => b.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        var bookDtos = books.Select(MapToDto).ToList();

        var result = new PagedResult<BookDto>
        {
            Items = bookDtos,
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = request.PageSize
        };

        await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(result),
            new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5) },
            cancellationToken);

        return result;
    }

    private static BookDto MapToDto(Book book)
    {
        var bookType = book.GetType().Name;

        var dto = new BookDto
        {
            Id = book.Id,
            Title = book.Title,
            Authors = book.Authors,
            Isbn = book.Isbn,
            BookType = bookType,
            PublishedDate = book.PublishedDate,
            Pages = book.Pages,
            Language = book.Language,
            Genre = book.Genre,
            Tags = book.Tags,
            Description = book.Description,
            CoverUrl = book.CoverUrl,
            IsAvailable = book.IsAvailable,
            CopiesAvailable = book.CopiesAvailable,
            TotalCopies = book.TotalCopies,
            AverageRating = book.AverageRating,
            ReviewCount = book.ReviewCount
        };

        switch (book)
        {
            case PrintedBook pb:
                dto.TypeSpecificData["publisher"] = pb.Publisher;
                dto.TypeSpecificData["edition"] = pb.Edition;
                dto.TypeSpecificData["format"] = pb.Format;
                break;
            case EBook eb:
                dto.TypeSpecificData["format"] = eb.Format;
                dto.TypeSpecificData["fileSize"] = eb.FileSize;
                dto.TypeSpecificData["drm"] = eb.Drm;
                break;
            case AudioBook ab:
                dto.TypeSpecificData["duration"] = ab.Duration;
                dto.TypeSpecificData["narrator"] = ab.Narrator;
                dto.TypeSpecificData["audioFormat"] = ab.AudioFormat;
                break;
        }

        return dto;
    }
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}

