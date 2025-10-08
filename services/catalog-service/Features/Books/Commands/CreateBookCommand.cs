using CatalogService.Data;
using CatalogService.Domain.Entities;
using CatalogService.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CatalogService.Features.Books.Commands;

public record CreateBookCommand(CreateBookDto BookDto) : IRequest<BookDto>;

public class CreateBookCommandHandler : IRequestHandler<CreateBookCommand, BookDto>
{
    private readonly CatalogDbContext _context;

    public CreateBookCommandHandler(CatalogDbContext context)
    {
        _context = context;
    }

    public async Task<BookDto> Handle(CreateBookCommand request, CancellationToken cancellationToken)
    {
        var dto = request.BookDto;

        Book book = dto.BookType switch
        {
            "PrintedBook" => new PrintedBook
            {
                Publisher = dto.TypeSpecificData.GetValueOrDefault("publisher")?.ToString() ?? "",
                Edition = dto.TypeSpecificData.GetValueOrDefault("edition")?.ToString() ?? "",
                Format = dto.TypeSpecificData.GetValueOrDefault("format")?.ToString() ?? "Hardcover"
            },
            "EBook" => new EBook
            {
                Format = dto.TypeSpecificData.GetValueOrDefault("format")?.ToString() ?? "EPUB",
                FileSize = Convert.ToInt64(dto.TypeSpecificData.GetValueOrDefault("fileSize") ?? 0),
                Drm = Convert.ToBoolean(dto.TypeSpecificData.GetValueOrDefault("drm") ?? false)
            },
            "AudioBook" => new AudioBook
            {
                Duration = Convert.ToInt32(dto.TypeSpecificData.GetValueOrDefault("duration") ?? 0),
                Narrator = dto.TypeSpecificData.GetValueOrDefault("narrator")?.ToString() ?? "",
                AudioFormat = dto.TypeSpecificData.GetValueOrDefault("audioFormat")?.ToString() ?? "MP3"
            },
            _ => throw new ArgumentException($"Unknown book type: {dto.BookType}")
        };

        book.Id = Guid.NewGuid();
        book.Title = dto.Title;
        book.Authors = dto.Authors;
        book.Isbn = dto.Isbn;
        book.PublishedDate = dto.PublishedDate;
        book.Pages = dto.Pages;
        book.Language = dto.Language;
        book.Genre = dto.Genre;
        book.Tags = dto.Tags;
        book.Description = dto.Description;
        book.CoverUrl = dto.CoverUrl;

        _context.Books.Add(book);
        await _context.SaveChangesAsync(cancellationToken);

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

