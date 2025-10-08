using CatalogService.Data;
using CatalogService.Domain.Entities;
using CatalogService.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CatalogService.Features.Books.Queries;

public record SearchBooksQuery(string Query, int Page = 1, int PageSize = 20) : IRequest<PagedResult<BookDto>>;

public class SearchBooksQueryHandler : IRequestHandler<SearchBooksQuery, PagedResult<BookDto>>
{
    private readonly CatalogDbContext _context;

    public SearchBooksQueryHandler(CatalogDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<BookDto>> Handle(SearchBooksQuery request, CancellationToken cancellationToken)
    {
        var searchTerm = request.Query.ToLower();

        var query = _context.Books
            .Include(b => b.Reviews)
            .Where(b =>
                b.Title.ToLower().Contains(searchTerm) ||
                b.Description.ToLower().Contains(searchTerm) ||
                b.Isbn.Contains(searchTerm) ||
                b.Genre.ToLower().Contains(searchTerm));

        var totalCount = await query.CountAsync(cancellationToken);

        var books = await query
            .OrderByDescending(b => b.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        var bookDtos = books.Select(MapToDto).ToList();

        return new PagedResult<BookDto>
        {
            Items = bookDtos,
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = request.PageSize
        };
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

