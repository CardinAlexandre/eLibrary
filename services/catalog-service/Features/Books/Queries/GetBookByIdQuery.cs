using CatalogService.Data;
using CatalogService.Domain.Entities;
using CatalogService.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CatalogService.Features.Books.Queries;

public record GetBookByIdQuery(Guid Id) : IRequest<BookDto?>;

public class GetBookByIdQueryHandler : IRequestHandler<GetBookByIdQuery, BookDto?>
{
    private readonly CatalogDbContext _context;

    public GetBookByIdQueryHandler(CatalogDbContext context)
    {
        _context = context;
    }

    public async Task<BookDto?> Handle(GetBookByIdQuery request, CancellationToken cancellationToken)
    {
        var book = await _context.Books
            .Include(b => b.Reviews)
            .Include(b => b.Loans)
            .FirstOrDefaultAsync(b => b.Id == request.Id, cancellationToken);

        if (book == null)
        {
            return null;
        }

        return MapToDto(book);
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

