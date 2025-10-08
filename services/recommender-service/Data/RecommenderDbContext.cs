using Microsoft.EntityFrameworkCore;
using RecommenderService.Domain;

namespace RecommenderService.Data;

public class RecommenderDbContext : DbContext
{
    public RecommenderDbContext(DbContextOptions<RecommenderDbContext> options) : base(options)
    {
    }

    public DbSet<UserInteraction> UserInteractions { get; set; }
    public DbSet<BookSimilarity> BookSimilarities { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<UserInteraction>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.InteractionType).HasConversion<string>();
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.BookId);
            entity.HasIndex(e => e.InteractionDate);
        });

        modelBuilder.Entity<BookSimilarity>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.BookId, e.SimilarBookId }).IsUnique();
            entity.HasIndex(e => e.SimilarityScore);
        });
    }
}

