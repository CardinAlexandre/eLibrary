using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CatalogService.Data;

namespace CatalogService.Controllers;

[ApiController]
[Route("api/catalog/[controller]")]
public class StatsController : ControllerBase
{
    private readonly CatalogDbContext _context;
    private readonly ILogger<StatsController> _logger;

    public StatsController(CatalogDbContext context, ILogger<StatsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("dashboard")]
    [Authorize(Roles = "Admin,Librarian")]
    public async Task<ActionResult> GetDashboardStats()
    {
        try
        {
            var totalBooks = await _context.Books.CountAsync();
            var totalLoans = await _context.Loans.CountAsync();
            
            var activeLoans = await _context.Loans
                .CountAsync(l => l.Status == Domain.Entities.LoanStatus.Active || 
                                l.Status == Domain.Entities.LoanStatus.Overdue);
            
            var overdueLoans = await _context.Loans
                .CountAsync(l => l.Status == Domain.Entities.LoanStatus.Active && 
                                l.DueDate < DateTime.UtcNow);

            var topGenres = await _context.Books
                .GroupBy(b => b.Genre)
                .Select(g => new
                {
                    Genre = g.Key,
                    Count = g.Count(),
                    LoanCount = g.SelectMany(b => b.Loans).Count(),
                    ActiveLoans = g.SelectMany(b => b.Loans)
                        .Count(l => l.Status == Domain.Entities.LoanStatus.Active || 
                                   l.Status == Domain.Entities.LoanStatus.Overdue)
                })
                .OrderByDescending(g => g.LoanCount)
                .Take(5)
                .ToListAsync();

            var topBooks = await _context.Books
                .Include(b => b.Loans)
                .Include(b => b.Reviews)
                .Select(b => new
                {
                    BookId = b.Id,
                    Title = b.Title,
                    LoanCount = b.Loans.Count,
                    ViewCount = 0,
                    AverageRating = b.Reviews.Any() ? b.Reviews.Average(r => r.Rating) : 0.0
                })
                .OrderByDescending(b => b.LoanCount)
                .Take(5)
                .ToListAsync();

            var recentActivity = await _context.Loans
                .Include(l => l.Book)
                .OrderByDescending(l => l.LoanDate)
                .Take(10)
                .Select(l => new
                {
                    EventType = l.Status == Domain.Entities.LoanStatus.Returned ? "Returned" : "Borrowed",
                    BookTitle = l.Book != null ? l.Book.Title : "Unknown",
                    UserEmail = l.UserEmail,
                    UserName = l.UserName,
                    EventDate = l.ReturnDate ?? l.LoanDate
                })
                .ToListAsync();

            var activeLoansDetails = await _context.Loans
                .Include(l => l.Book)
                .Where(l => l.Status == Domain.Entities.LoanStatus.Active || 
                           l.Status == Domain.Entities.LoanStatus.Overdue)
                .OrderBy(l => l.DueDate)
                .Select(l => new
                {
                    LoanId = l.Id,
                    BookId = l.BookId,
                    BookTitle = l.Book != null ? l.Book.Title : "Unknown",
                    UserEmail = l.UserEmail,
                    UserName = l.UserName,
                    LoanDate = l.LoanDate,
                    DueDate = l.DueDate,
                    IsOverdue = l.DueDate < DateTime.UtcNow,
                    DaysOverdue = l.DueDate < DateTime.UtcNow ? (int)(DateTime.UtcNow - l.DueDate).TotalDays : 0,
                    LateFee = l.DueDate < DateTime.UtcNow ? (int)(DateTime.UtcNow - l.DueDate).TotalDays * 0.5m : 0m
                })
                .ToListAsync();

            var dashboard = new
            {
                totalBooks,
                totalLoans,
                activeLoans,
                overdueLoans,
                totalCopies = await _context.Books.SumAsync(b => b.TotalCopies),
                availableCopies = await _context.Books.SumAsync(b => b.CopiesAvailable),
                topGenres,
                topBooks,
                recentActivity,
                activeLoansDetails
            };

            return Ok(dashboard);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching dashboard stats");
            return StatusCode(500, new { error = "Error fetching dashboard stats" });
        }
    }
}

