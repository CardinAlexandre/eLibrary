namespace RecommenderService.Domain;

public class BookSimilarity
{
    public Guid Id { get; set; }
    public Guid BookId { get; set; }
    public Guid SimilarBookId { get; set; }
    public double SimilarityScore { get; set; }
    public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;
    public string SimilarityReason { get; set; } = string.Empty;
}

