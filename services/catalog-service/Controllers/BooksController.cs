using CatalogService.DTOs;
using CatalogService.Features.Books.Commands;
using CatalogService.Features.Books.Queries;
using CatalogService.Seeders;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CatalogService.Controllers;

[ApiController]
[Route("api/catalog/[controller]")]
public class BooksController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<BooksController> _logger;
    private readonly IServiceProvider _serviceProvider;

    public BooksController(IMediator mediator, ILogger<BooksController> logger, IServiceProvider serviceProvider)
    {
        _mediator = mediator;
        _logger = logger;
        _serviceProvider = serviceProvider;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<BookDto>>> GetBooks(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? genre = null,
        [FromQuery] string? language = null,
        [FromQuery] string? bookType = null)
    {
        _logger.LogInformation("Fetching books - Page: {Page}, PageSize: {PageSize}", page, pageSize);
        var result = await _mediator.Send(new GetBooksQuery(page, pageSize, genre, language, bookType));
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<BookDto>> GetBookById(Guid id)
    {
        _logger.LogInformation("Fetching book with ID: {BookId}", id);
        var result = await _mediator.Send(new GetBookByIdQuery(id));

        if (result == null)
        {
            return NotFound(new { message = $"Book with ID {id} not found" });
        }

        return Ok(result);
    }

    [HttpGet("search")]
    public async Task<ActionResult<PagedResult<BookDto>>> SearchBooks(
        [FromQuery] string q,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (string.IsNullOrWhiteSpace(q))
        {
            return BadRequest(new { message = "Search query cannot be empty" });
        }

        _logger.LogInformation("Searching books with query: {Query}", q);
        var result = await _mediator.Send(new SearchBooksQuery(q, page, pageSize));
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Librarian")]
    public async Task<ActionResult<BookDto>> CreateBook([FromBody] CreateBookDto bookDto)
    {
        _logger.LogInformation("Creating new book: {Title}", bookDto.Title);
        var result = await _mediator.Send(new CreateBookCommand(bookDto));
        return CreatedAtAction(nameof(GetBookById), new { id = result.Id }, result);
    }

    [HttpPost("seed")]
    [Authorize(Roles = "Admin,Librarian")]
    public async Task<ActionResult> SeedDatabase()
    {
        try
        {
            _logger.LogInformation("Starting database seed...");
            var seeder = new DatabaseSeeder(_serviceProvider);
            await seeder.SeedAsync();
            _logger.LogInformation("Database seeded successfully");
            return Ok(new { message = "Database seeded successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error seeding database");
            return StatusCode(500, new { message = "Error seeding database", error = ex.Message });
        }
    }

    [HttpDelete("clear")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> ClearAllBooks()
    {
        try
        {
            _logger.LogInformation("Clearing all books from database...");
            var result = await _mediator.Send(new ClearBooksCommand());
            _logger.LogInformation("All books cleared successfully");
            return Ok(new { message = $"Deleted {result} books successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing books");
            return StatusCode(500, new { message = "Error clearing books", error = ex.Message });
        }
    }
}

public class ImportResult
{
    public int TotalCount { get; set; }
    public int SuccessCount { get; set; }
    public int FailureCount { get; set; }
    public List<string> Errors { get; set; } = new();
}

