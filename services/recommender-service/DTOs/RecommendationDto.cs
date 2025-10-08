namespace RecommenderService.DTOs;

public class RecommendationDto
{
    public Guid BookId { get; set; }
    public string Title { get; set; } = string.Empty;
    public List<string> Authors { get; set; } = new();
    public string Genre { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = new();
    public string CoverUrl { get; set; } = string.Empty;
    public double Score { get; set; } // 0.0 - 1.0
    public string Reason { get; set; } = string.Empty;
    public double AverageRating { get; set; }
}

public class SimilarBookDto
{
    public Guid BookId { get; set; }
    public string Title { get; set; } = string.Empty;
    public List<string> Authors { get; set; } = new();
    public string Genre { get; set; } = string.Empty;
    public double SimilarityScore { get; set; }
    public string Reason { get; set; } = string.Empty;
}

