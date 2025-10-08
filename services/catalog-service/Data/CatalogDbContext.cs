using CatalogService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace CatalogService.Data;

public class CatalogDbContext : DbContext
{
    public CatalogDbContext(DbContextOptions<CatalogDbContext> options) : base(options)
    {
    }

    public DbSet<Book> Books { get; set; }
    public DbSet<PrintedBook> PrintedBooks { get; set; }
    public DbSet<EBook> EBooks { get; set; }
    public DbSet<AudioBook> AudioBooks { get; set; }
    public DbSet<Loan> Loans { get; set; }
    public DbSet<Review> Reviews { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Table Per Hierarchy (TPH) configuration for Book inheritance
        modelBuilder.Entity<Book>()
            .HasDiscriminator<string>("BookType")
            .HasValue<PrintedBook>("PrintedBook")
            .HasValue<EBook>("EBook")
            .HasValue<AudioBook>("AudioBook");

        // Book configuration
        modelBuilder.Entity<Book>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Isbn).HasMaxLength(20);
            entity.Property(e => e.Language).HasMaxLength(10);
            entity.Property(e => e.Genre).HasMaxLength(100);

            // Convert List<string> to JSON for storage
            entity.Property(e => e.Authors)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>());

            entity.Property(e => e.Tags)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>());

            // Indexes for performance
            entity.HasIndex(e => e.Isbn);
            entity.HasIndex(e => e.Title);
            entity.HasIndex(e => e.Genre);
        });

        // Loan configuration
        modelBuilder.Entity<Loan>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserEmail).IsRequired().HasMaxLength(256);
            entity.Property(e => e.Status).HasConversion<string>();

            entity.HasOne(e => e.Book)
                .WithMany(b => b.Loans)
                .HasForeignKey(e => e.BookId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.DueDate);
        });

        // Review configuration
        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Rating).IsRequired();
            entity.Property(e => e.Comment).HasMaxLength(2000);

            entity.HasOne(e => e.Book)
                .WithMany(b => b.Reviews)
                .HasForeignKey(e => e.BookId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Rating);
        });
    }
}

