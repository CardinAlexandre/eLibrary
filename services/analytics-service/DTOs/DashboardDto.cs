namespace AnalyticsService.DTOs;

public class DashboardDto
{
    public int TotalBooks { get; set; }
    public int TotalLoans { get; set; }
    public int ActiveLoans { get; set; }
    public int OverdueLoans { get; set; }
    public int TotalCopies { get; set; }
    public int AvailableCopies { get; set; }
    public List<GenreStatsDto> TopGenres { get; set; } = new();
    public List<BookStatsDto> TopBooks { get; set; } = new();
    public List<RecentActivityDto> RecentActivity { get; set; } = new();
}

public class GenreStatsDto
{
    public string Genre { get; set; } = string.Empty;
    public int Count { get; set; }
    public int LoanCount { get; set; }
    public int ActiveLoans { get; set; }
}

public class BookStatsDto
{
    public Guid BookId { get; set; }
    public string Title { get; set; } = string.Empty;
    public int LoanCount { get; set; }
    public int ViewCount { get; set; }
    public double AverageRating { get; set; }
}

public class RecentActivityDto
{
    public string EventType { get; set; } = string.Empty;
    public string BookTitle { get; set; } = string.Empty;
    public DateTime EventDate { get; set; }
}

