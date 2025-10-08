namespace CatalogService.DTOs;

public class BookDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public List<string> Authors { get; set; } = new();
    public string Isbn { get; set; } = string.Empty;
    public string BookType { get; set; } = string.Empty;
    public DateTime PublishedDate { get; set; }
    public int Pages { get; set; }
    public string Language { get; set; } = string.Empty;
    public string Genre { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = new();
    public string Description { get; set; } = string.Empty;
    public string CoverUrl { get; set; } = string.Empty;
    public bool IsAvailable { get; set; }
    public double AverageRating { get; set; }
    public int ReviewCount { get; set; }

    // Type-specific properties (will be populated based on BookType)
    public Dictionary<string, object> TypeSpecificData { get; set; } = new();
}

public class CreateBookDto
{
    public string Title { get; set; } = string.Empty;
    public List<string> Authors { get; set; } = new();
    public string Isbn { get; set; } = string.Empty;
    public string BookType { get; set; } = string.Empty;
    public DateTime PublishedDate { get; set; }
    public int Pages { get; set; }
    public string Language { get; set; } = string.Empty;
    public string Genre { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = new();
    public string Description { get; set; } = string.Empty;
    public string CoverUrl { get; set; } = string.Empty;
    public Dictionary<string, object> TypeSpecificData { get; set; } = new();
}

public class UpdateBookDto
{
    public string? Title { get; set; }
    public List<string>? Authors { get; set; }
    public string? Description { get; set; }
    public List<string>? Tags { get; set; }
    public bool? IsAvailable { get; set; }
}

