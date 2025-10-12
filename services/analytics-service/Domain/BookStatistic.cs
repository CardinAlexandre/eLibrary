namespace AnalyticsService.Domain;

public class BookStatistic
{
    public Guid Id { get; set; }
    public Guid BookId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Genre { get; set; } = string.Empty;
    public int ViewCount { get; set; }
    public int LoanCount { get; set; }
    public int ReviewCount { get; set; }
    public double AverageRating { get; set; }
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}

