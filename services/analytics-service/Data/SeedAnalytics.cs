using AnalyticsService.Domain;
using Microsoft.EntityFrameworkCore;

namespace AnalyticsService.Data;

public class SeedAnalytics
{
    public static async Task Initialize(AnalyticsDbContext context)
    {
        if (await context.BookStatistics.AnyAsync())
        {
            return;
        }

        var bookStats = new List<BookStatistic>
        {
            new() { Id = Guid.NewGuid(), BookId = Guid.Parse("550e8400-e29b-41d4-a716-446655440001"), Title = "Les Misérables", Genre = "Classic Literature", ViewCount = 150, LoanCount = 45, ReviewCount = 12, AverageRating = 4.5 },
            new() { Id = Guid.NewGuid(), BookId = Guid.Parse("550e8400-e29b-41d4-a716-446655440002"), Title = "1984", Genre = "Science Fiction", ViewCount = 200, LoanCount = 67, ReviewCount = 25, AverageRating = 4.8 },
            new() { Id = Guid.NewGuid(), BookId = Guid.Parse("550e8400-e29b-41d4-a716-446655440003"), Title = "Le Petit Prince", Genre = "Children's Literature", ViewCount = 300, LoanCount = 89, ReviewCount = 35, AverageRating = 4.9 },
            new() { Id = Guid.NewGuid(), BookId = Guid.Parse("550e8400-e29b-41d4-a716-446655440004"), Title = "Harry Potter", Genre = "Fantasy", ViewCount = 250, LoanCount = 78, ReviewCount = 30, AverageRating = 4.7 },
            new() { Id = Guid.NewGuid(), BookId = Guid.Parse("550e8400-e29b-41d4-a716-446655440005"), Title = "L'Étranger", Genre = "Philosophy", ViewCount = 120, LoanCount = 34, ReviewCount = 15, AverageRating = 4.3 }
        };

        context.BookStatistics.AddRange(bookStats);

        var genreStats = new List<GenreStatistic>
        {
            new() { Id = Guid.NewGuid(), Genre = "Science Fiction", BookCount = 8, TotalLoans = 150, ActiveLoans = 12 },
            new() { Id = Guid.NewGuid(), Genre = "Fantasy", BookCount = 6, TotalLoans = 120, ActiveLoans = 10 },
            new() { Id = Guid.NewGuid(), Genre = "Classic Literature", BookCount = 10, TotalLoans = 180, ActiveLoans = 15 },
            new() { Id = Guid.NewGuid(), Genre = "Children's Literature", BookCount = 4, TotalLoans = 95, ActiveLoans = 8 },
            new() { Id = Guid.NewGuid(), Genre = "Philosophy", BookCount = 5, TotalLoans = 75, ActiveLoans = 5 }
        };

        context.GenreStatistics.AddRange(genreStats);

        var now = DateTime.UtcNow;
        var loanEvents = new List<LoanEvent>
        {
            new() { Id = Guid.NewGuid(), BookId = bookStats[0].BookId, UserId = Guid.NewGuid(), EventType = "Borrowed", EventDate = now.AddDays(-5), DueDate = now.AddDays(9) },
            new() { Id = Guid.NewGuid(), BookId = bookStats[1].BookId, UserId = Guid.NewGuid(), EventType = "Borrowed", EventDate = now.AddDays(-10), DueDate = now.AddDays(4), ReturnDate = now.AddDays(-3) },
            new() { Id = Guid.NewGuid(), BookId = bookStats[2].BookId, UserId = Guid.NewGuid(), EventType = "Borrowed", EventDate = now.AddDays(-20), DueDate = now.AddDays(-6) },
            new() { Id = Guid.NewGuid(), BookId = bookStats[3].BookId, UserId = Guid.NewGuid(), EventType = "Borrowed", EventDate = now.AddDays(-3), DueDate = now.AddDays(11) },
            new() { Id = Guid.NewGuid(), BookId = bookStats[4].BookId, UserId = Guid.NewGuid(), EventType = "Borrowed", EventDate = now.AddDays(-15), DueDate = now.AddDays(-1) }
        };

        context.LoanEvents.AddRange(loanEvents);

        await context.SaveChangesAsync();
    }
}

