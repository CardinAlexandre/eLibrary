namespace CatalogService.Domain.Entities;

public abstract class Book
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public List<string> Authors { get; set; } = new();
    public string Isbn { get; set; } = string.Empty;
    public DateTime PublishedDate { get; set; }
    public int Pages { get; set; }
    public string Language { get; set; } = string.Empty;
    public string Genre { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = new();
    public string Description { get; set; } = string.Empty;
    public string CoverUrl { get; set; } = string.Empty;
    public bool IsAvailable { get; set; } = true;
    public int CopiesAvailable { get; set; } = 1;
    public int TotalCopies { get; set; } = 1;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public virtual ICollection<Loan> Loans { get; set; } = new List<Loan>();
    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();

    // Calculated properties
    public double AverageRating => Reviews.Any() ? Reviews.Average(r => r.Rating) : 0.0;
    public int ReviewCount => Reviews.Count;
}

