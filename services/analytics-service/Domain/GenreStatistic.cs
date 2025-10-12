namespace AnalyticsService.Domain;

public class GenreStatistic
{
    public Guid Id { get; set; }
    public string Genre { get; set; } = string.Empty;
    public int BookCount { get; set; }
    public int TotalLoans { get; set; }
    public int ActiveLoans { get; set; }
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}

