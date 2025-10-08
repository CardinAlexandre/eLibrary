using CatalogService.Data;
using CatalogService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace CatalogService.Seeders;

public class DatabaseSeeder
{
    private readonly CatalogDbContext _context;
    private readonly ILogger<DatabaseSeeder> _logger;

    public DatabaseSeeder(IServiceProvider serviceProvider)
    {
        _context = serviceProvider.GetRequiredService<CatalogDbContext>();
        _logger = serviceProvider.GetRequiredService<ILogger<DatabaseSeeder>>();
    }

    public async Task SeedAsync()
    {
        try
        {
            // Ensure database is created and migrated
            await _context.Database.MigrateAsync();

            // Check if data already exists
            if (await _context.Books.AnyAsync())
            {
                _logger.LogInformation("Database already contains data, skipping seed");
                return;
            }

            // Read books from JSON file
            var jsonPath = FindBooksJsonFile();

            if (jsonPath == null)
            {
                _logger.LogWarning("Books JSON file not found. Searched recursively from {BaseDirectory}", AppContext.BaseDirectory);
                return;
            }

            _logger.LogInformation("Found books.json at {Path}", jsonPath);

            var json = await File.ReadAllTextAsync(jsonPath);
            var booksData = JsonSerializer.Deserialize<List<BookData>>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (booksData == null || !booksData.Any())
            {
                _logger.LogWarning("No books data found in JSON file");
                return;
            }

            foreach (var bookData in booksData)
            {
                Book book = bookData.Type switch
                {
                    "PrintedBook" => new PrintedBook
                    {
                        Publisher = bookData.Publisher ?? "",
                        Edition = bookData.Edition ?? "",
                        Format = "Hardcover"
                    },
                    "EBook" => new EBook
                    {
                        Format = bookData.Format ?? "EPUB",
                        FileSize = bookData.FileSize ?? 0,
                        Drm = bookData.Drm ?? false
                    },
                    "AudioBook" => new AudioBook
                    {
                        Duration = bookData.Duration ?? 0,
                        Narrator = bookData.Narrator ?? "",
                        AudioFormat = bookData.AudioFormat ?? "MP3"
                    },
                    _ => throw new InvalidOperationException($"Unknown book type: {bookData.Type}")
                };

                book.Id = Guid.Parse(bookData.Id ?? Guid.NewGuid().ToString());
                book.Title = bookData.Title ?? "";
                book.Authors = bookData.Authors ?? new List<string>();
                book.Isbn = bookData.Isbn ?? "";
                book.PublishedDate = DateTime.Parse(bookData.PublishedDate ?? DateTime.Now.ToString());
                book.Pages = bookData.Pages ?? 0;
                book.Language = bookData.Language ?? "en";
                book.Genre = bookData.Genre ?? "";
                book.Tags = bookData.Tags ?? new List<string>();
                book.Description = bookData.Description ?? "";
                book.CoverUrl = bookData.CoverUrl ?? "";

                _context.Books.Add(book);
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("Successfully seeded {Count} books", booksData.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while seeding the database");
            throw;
        }
    }

    private static string? FindBooksJsonFile()
    {
        // Start from the application base directory
        var currentDirectory = new DirectoryInfo(AppContext.BaseDirectory);

        // Search upwards through parent directories
        while (currentDirectory != null)
        {
            var dataFolder = Path.Combine(currentDirectory.FullName, "data");
            var jsonFilePath = Path.Combine(dataFolder, "books.json");

            if (File.Exists(jsonFilePath))
            {
                return jsonFilePath;
            }

            currentDirectory = currentDirectory.Parent;
        }

        return null;
    }
}

public class BookData
{
    public string? Id { get; set; }
    public string? Title { get; set; }
    public List<string>? Authors { get; set; }
    public string? Isbn { get; set; }
    public string? Type { get; set; }
    public string? PublishedDate { get; set; }
    public int? Pages { get; set; }
    public string? Language { get; set; }
    public string? Genre { get; set; }
    public List<string>? Tags { get; set; }
    public string? Description { get; set; }
    public string? CoverUrl { get; set; }
    public string? Publisher { get; set; }
    public string? Edition { get; set; }
    public string? Format { get; set; }
    public long? FileSize { get; set; }
    public bool? Drm { get; set; }
    public int? Duration { get; set; }
    public string? Narrator { get; set; }
    public string? AudioFormat { get; set; }
}

