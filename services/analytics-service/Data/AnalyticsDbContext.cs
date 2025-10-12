using AnalyticsService.Domain;
using Microsoft.EntityFrameworkCore;

namespace AnalyticsService.Data;

public class AnalyticsDbContext : DbContext
{
    public AnalyticsDbContext(DbContextOptions<AnalyticsDbContext> options) : base(options)
    {
    }

    public DbSet<BookStatistic> BookStatistics { get; set; }
    public DbSet<LoanEvent> LoanEvents { get; set; }
    public DbSet<GenreStatistic> GenreStatistics { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<BookStatistic>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.BookId);
            entity.HasIndex(e => e.Genre);
            entity.Property(e => e.Title).HasMaxLength(500);
            entity.Property(e => e.Genre).HasMaxLength(100);
        });

        modelBuilder.Entity<LoanEvent>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.BookId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.EventDate);
            entity.Property(e => e.EventType).HasMaxLength(50);
        });

        modelBuilder.Entity<GenreStatistic>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Genre).IsUnique();
            entity.Property(e => e.Genre).HasMaxLength(100);
        });
    }
}

