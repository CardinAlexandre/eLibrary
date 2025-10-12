using AnalyticsService.Data;
using AnalyticsService.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AnalyticsService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AnalyticsController : ControllerBase
{
    private readonly AnalyticsDbContext _context;
    private readonly ILogger<AnalyticsController> _logger;

    public AnalyticsController(AnalyticsDbContext context, ILogger<AnalyticsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("dashboard")]
    [Authorize(Roles = "Admin,Librarian")]
    public async Task<ActionResult<DashboardDto>> GetDashboard()
    {
        try
        {
            var totalBooks = await _context.BookStatistics.CountAsync();
            var totalCopies = await _context.BookStatistics.SumAsync(b => b.LoanCount);
            
            var totalLoans = await _context.LoanEvents.CountAsync();
            var activeLoans = await _context.LoanEvents
                .CountAsync(l => l.EventType == "Borrowed" && l.ReturnDate == null);
            
            var overdueLoans = await _context.LoanEvents
                .Where(l => l.EventType == "Borrowed" 
                    && l.ReturnDate == null 
                    && l.DueDate < DateTime.UtcNow)
                .CountAsync();

            var topGenres = await _context.GenreStatistics
                .OrderByDescending(g => g.TotalLoans)
                .Take(5)
                .Select(g => new GenreStatsDto
                {
                    Genre = g.Genre,
                    Count = g.BookCount,
                    LoanCount = g.TotalLoans,
                    ActiveLoans = g.ActiveLoans
                })
                .ToListAsync();

            var topBooks = await _context.BookStatistics
                .OrderByDescending(b => b.LoanCount)
                .Take(5)
                .Select(b => new BookStatsDto
                {
                    BookId = b.BookId,
                    Title = b.Title,
                    LoanCount = b.LoanCount,
                    ViewCount = b.ViewCount,
                    AverageRating = b.AverageRating
                })
                .ToListAsync();

            var recentActivity = await _context.LoanEvents
                .OrderByDescending(l => l.EventDate)
                .Take(10)
                .Join(
                    _context.BookStatistics,
                    loan => loan.BookId,
                    book => book.BookId,
                    (loan, book) => new RecentActivityDto
                    {
                        EventType = loan.EventType,
                        BookTitle = book.Title,
                        EventDate = loan.EventDate
                    })
                .ToListAsync();

            var dashboard = new DashboardDto
            {
                TotalBooks = totalBooks,
                TotalLoans = totalLoans,
                ActiveLoans = activeLoans,
                OverdueLoans = overdueLoans,
                TotalCopies = totalCopies,
                AvailableCopies = totalCopies - activeLoans,
                TopGenres = topGenres,
                TopBooks = topBooks,
                RecentActivity = recentActivity
            };

            return Ok(dashboard);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching dashboard data");
            return StatusCode(500, new { message = "Error fetching dashboard data" });
        }
    }

    [HttpPost("track/view")]
    public async Task<IActionResult> TrackBookView([FromBody] TrackViewDto dto)
    {
        try
        {
            var stat = await _context.BookStatistics.FirstOrDefaultAsync(b => b.BookId == dto.BookId);
            
            if (stat == null)
            {
                stat = new AnalyticsService.Domain.BookStatistic
                {
                    Id = Guid.NewGuid(),
                    BookId = dto.BookId,
                    Title = dto.Title,
                    Genre = dto.Genre,
                    ViewCount = 1
                };
                _context.BookStatistics.Add(stat);
            }
            else
            {
                stat.ViewCount++;
                stat.LastUpdated = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error tracking book view");
            return StatusCode(500);
        }
    }
}

public class TrackViewDto
{
    public Guid BookId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Genre { get; set; } = string.Empty;
}

