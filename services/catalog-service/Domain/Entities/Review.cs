namespace CatalogService.Domain.Entities;

public class Review
{
    public Guid Id { get; set; }
    public Guid BookId { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public int Rating { get; set; } // 1-5 stars
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public int HelpfulCount { get; set; } = 0;

    // Navigation property
    public virtual Book? Book { get; set; }
}

