namespace CatalogService.DTOs;

public class ReviewDto
{
    public Guid Id { get; set; }
    public Guid BookId { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int HelpfulCount { get; set; }
}

public class CreateReviewDto
{
    public Guid BookId { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
}

public class UpdateReviewDto
{
    public int? Rating { get; set; }
    public string? Comment { get; set; }
}

