namespace RecommenderService.Domain;

public class UserInteraction
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid BookId { get; set; }
    public InteractionType InteractionType { get; set; }
    public DateTime InteractionDate { get; set; } = DateTime.UtcNow;
    public int? Rating { get; set; } // 1-5 pour les reviews
    public string? Tags { get; set; } // JSON array des tags du livre
    public string? Genre { get; set; }
    public string? Language { get; set; }
}

public enum InteractionType
{
    View = 1,
    Borrow = 2,
    Review = 3,
    Favorite = 4
}

