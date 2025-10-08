using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using RecommenderService.Data;
using RecommenderService.Domain;
using RecommenderService.DTOs;
using System.Text.Json;

namespace RecommenderService.Services;

public class RecommendationEngine
{
    private readonly RecommenderDbContext _context;
    private readonly CatalogServiceClient _catalogService;
    private readonly IDistributedCache _cache;
    private readonly ILogger<RecommendationEngine> _logger;

    public RecommendationEngine(
        RecommenderDbContext context,
        CatalogServiceClient catalogService,
        IDistributedCache cache,
        ILogger<RecommendationEngine> logger)
    {
        _context = context;
        _catalogService = catalogService;
        _cache = cache;
        _logger = logger;
    }

    public async Task<List<RecommendationDto>> GetRecommendationsForUserAsync(Guid userId, int limit = 10)
    {
        var cacheKey = $"recommendations:{userId}:{limit}";
        var cached = await _cache.GetStringAsync(cacheKey);

        if (cached != null)
        {
            return JsonSerializer.Deserialize<List<RecommendationDto>>(cached) ?? new();
        }

        var recommendations = new List<RecommendationDto>();

        // 1. Content-based recommendations (basé sur l'historique de l'utilisateur)
        var contentBased = await GetContentBasedRecommendationsAsync(userId, limit);
        recommendations.AddRange(contentBased);

        // 2. Collaborative filtering (basé sur les utilisateurs similaires)
        var collaborative = await GetCollaborativeRecommendationsAsync(userId, limit);
        recommendations.AddRange(collaborative);

        // 3. Popular books (fallback si pas assez d'historique)
        if (recommendations.Count < limit)
        {
            var popular = await GetPopularBooksAsync(limit - recommendations.Count);
            recommendations.AddRange(popular);
        }

        // Dédupliquer et trier par score
        var uniqueRecommendations = recommendations
            .GroupBy(r => r.BookId)
            .Select(g => g.OrderByDescending(r => r.Score).First())
            .OrderByDescending(r => r.Score)
            .Take(limit)
            .ToList();

        // Cache pour 10 minutes
        await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(uniqueRecommendations),
            new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10) });

        return uniqueRecommendations;
    }

    public async Task<List<SimilarBookDto>> GetSimilarBooksAsync(Guid bookId, int limit = 5)
    {
        var cacheKey = $"similar:{bookId}:{limit}";
        var cached = await _cache.GetStringAsync(cacheKey);

        if (cached != null)
        {
            return JsonSerializer.Deserialize<List<SimilarBookDto>>(cached) ?? new();
        }

        // Récupérer depuis la base de données
        var similarities = await _context.BookSimilarities
            .Where(s => s.BookId == bookId)
            .OrderByDescending(s => s.SimilarityScore)
            .Take(limit)
            .ToListAsync();

        var similarBooks = new List<SimilarBookDto>();

        foreach (var similarity in similarities)
        {
            var book = await _catalogService.GetBookByIdAsync(similarity.SimilarBookId);
            if (book != null)
            {
                similarBooks.Add(new SimilarBookDto
                {
                    BookId = book.Id,
                    Title = book.Title,
                    Authors = book.Authors,
                    Genre = book.Genre,
                    SimilarityScore = similarity.SimilarityScore,
                    Reason = similarity.SimilarityReason
                });
            }
        }

        // Si pas de similarités pré-calculées, calculer en temps réel
        if (similarBooks.Count == 0)
        {
            similarBooks = await CalculateSimilarBooksRealTimeAsync(bookId, limit);
        }

        await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(similarBooks),
            new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30) });

        return similarBooks;
    }

    private async Task<List<RecommendationDto>> GetContentBasedRecommendationsAsync(Guid userId, int limit)
    {
        // Récupérer l'historique de l'utilisateur
        var userInteractions = await _context.UserInteractions
            .Where(i => i.UserId == userId)
            .OrderByDescending(i => i.InteractionDate)
            .Take(50)
            .ToListAsync();

        if (!userInteractions.Any())
        {
            return new List<RecommendationDto>();
        }

        // Analyser les préférences (genres, tags)
        var preferredGenres = userInteractions
            .Where(i => i.Genre != null)
            .GroupBy(i => i.Genre)
            .OrderByDescending(g => g.Count())
            .Select(g => g.Key!)
            .Take(3)
            .ToList();

        // Récupérer tous les livres du catalogue
        var allBooks = await _catalogService.GetAllBooksAsync();
        if (allBooks == null)
        {
            return new List<RecommendationDto>();
        }

        // Exclure les livres déjà vus
        var seenBookIds = userInteractions.Select(i => i.BookId).ToHashSet();
        var candidateBooks = allBooks.Where(b => !seenBookIds.Contains(b.Id)).ToList();

        // Scorer chaque livre
        var recommendations = candidateBooks
            .Select(book => new RecommendationDto
            {
                BookId = book.Id,
                Title = book.Title,
                Authors = book.Authors,
                Genre = book.Genre,
                Tags = book.Tags,
                CoverUrl = book.CoverUrl,
                AverageRating = book.AverageRating,
                Score = CalculateContentScore(book, preferredGenres, userInteractions),
                Reason = $"Basé sur votre intérêt pour {string.Join(", ", preferredGenres.Take(2))}"
            })
            .OrderByDescending(r => r.Score)
            .Take(limit)
            .ToList();

        return recommendations;
    }

    private double CalculateContentScore(BookData book, List<string> preferredGenres, List<UserInteraction> history)
    {
        double score = 0.0;

        // Genre match (poids: 0.4)
        if (preferredGenres.Contains(book.Genre))
        {
            score += 0.4;
        }

        // Tags match (poids: 0.3)
        var userTags = history
            .Where(i => i.Tags != null)
            .SelectMany(i => JsonSerializer.Deserialize<List<string>>(i.Tags!) ?? new())
            .GroupBy(t => t)
            .OrderByDescending(g => g.Count())
            .Select(g => g.Key)
            .Take(5)
            .ToHashSet();

        var commonTags = book.Tags.Count(t => userTags.Contains(t));
        score += (commonTags / (double)Math.Max(book.Tags.Count, 1)) * 0.3;

        // Rating (poids: 0.2)
        score += (book.AverageRating / 5.0) * 0.2;

        // Popularité (poids: 0.1)
        score += Math.Min(book.ReviewCount / 100.0, 1.0) * 0.1;

        return Math.Min(score, 1.0);
    }

    private async Task<List<RecommendationDto>> GetCollaborativeRecommendationsAsync(Guid userId, int limit)
    {
        // Trouver des utilisateurs similaires (qui ont emprunté des livres similaires)
        var userBooks = await _context.UserInteractions
            .Where(i => i.UserId == userId && i.InteractionType == InteractionType.Borrow)
            .Select(i => i.BookId)
            .ToListAsync();

        if (!userBooks.Any())
        {
            return new List<RecommendationDto>();
        }

        // Trouver d'autres utilisateurs qui ont emprunté ces mêmes livres
        var similarUserIds = await _context.UserInteractions
            .Where(i => userBooks.Contains(i.BookId) && i.UserId != userId)
            .GroupBy(i => i.UserId)
            .OrderByDescending(g => g.Count())
            .Take(10)
            .Select(g => g.Key)
            .ToListAsync();

        // Récupérer les livres que ces utilisateurs ont aimés mais que l'utilisateur actuel n'a pas vus
        var recommendations = await _context.UserInteractions
            .Where(i => similarUserIds.Contains(i.UserId) && !userBooks.Contains(i.BookId))
            .GroupBy(i => i.BookId)
            .Select(g => new { BookId = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(limit)
            .ToListAsync();

        var result = new List<RecommendationDto>();

        foreach (var rec in recommendations)
        {
            var book = await _catalogService.GetBookByIdAsync(rec.BookId);
            if (book != null)
            {
                result.Add(new RecommendationDto
                {
                    BookId = book.Id,
                    Title = book.Title,
                    Authors = book.Authors,
                    Genre = book.Genre,
                    Tags = book.Tags,
                    CoverUrl = book.CoverUrl,
                    AverageRating = book.AverageRating,
                    Score = Math.Min(rec.Count / 10.0, 1.0),
                    Reason = "Apprécié par des lecteurs ayant des goûts similaires"
                });
            }
        }

        return result;
    }

    private async Task<List<RecommendationDto>> GetPopularBooksAsync(int limit)
    {
        var allBooks = await _catalogService.GetAllBooksAsync();
        if (allBooks == null)
        {
            return new List<RecommendationDto>();
        }

        return allBooks
            .OrderByDescending(b => b.AverageRating)
            .ThenByDescending(b => b.ReviewCount)
            .Take(limit)
            .Select(book => new RecommendationDto
            {
                BookId = book.Id,
                Title = book.Title,
                Authors = book.Authors,
                Genre = book.Genre,
                Tags = book.Tags,
                CoverUrl = book.CoverUrl,
                AverageRating = book.AverageRating,
                Score = book.AverageRating / 5.0,
                Reason = "Populaire auprès des lecteurs"
            })
            .ToList();
    }

    private async Task<List<SimilarBookDto>> CalculateSimilarBooksRealTimeAsync(Guid bookId, int limit)
    {
        var sourceBook = await _catalogService.GetBookByIdAsync(bookId);
        if (sourceBook == null)
        {
            return new List<SimilarBookDto>();
        }

        var allBooks = await _catalogService.GetAllBooksAsync();
        if (allBooks == null)
        {
            return new List<SimilarBookDto>();
        }

        var similarBooks = allBooks
            .Where(b => b.Id != bookId)
            .Select(book => new
            {
                Book = book,
                Similarity = CalculateSimilarity(sourceBook, book)
            })
            .Where(x => x.Similarity > 0.3)
            .OrderByDescending(x => x.Similarity)
            .Take(limit)
            .Select(x => new SimilarBookDto
            {
                BookId = x.Book.Id,
                Title = x.Book.Title,
                Authors = x.Book.Authors,
                Genre = x.Book.Genre,
                SimilarityScore = x.Similarity,
                Reason = GetSimilarityReason(sourceBook, x.Book)
            })
            .ToList();

        return similarBooks;
    }

    private double CalculateSimilarity(BookData book1, BookData book2)
    {
        double score = 0.0;

        // Même genre (poids: 0.4)
        if (book1.Genre == book2.Genre)
        {
            score += 0.4;
        }

        // Tags communs (poids: 0.4)
        var commonTags = book1.Tags.Intersect(book2.Tags).Count();
        if (book1.Tags.Any() && book2.Tags.Any())
        {
            score += (commonTags / (double)Math.Max(book1.Tags.Count, book2.Tags.Count)) * 0.4;
        }

        // Même langue (poids: 0.1)
        if (book1.Language == book2.Language)
        {
            score += 0.1;
        }

        // Auteurs communs (poids: 0.1)
        var commonAuthors = book1.Authors.Intersect(book2.Authors).Count();
        if (commonAuthors > 0)
        {
            score += 0.1;
        }

        return Math.Min(score, 1.0);
    }

    private string GetSimilarityReason(BookData book1, BookData book2)
    {
        var reasons = new List<string>();

        if (book1.Genre == book2.Genre)
        {
            reasons.Add($"même genre ({book1.Genre})");
        }

        var commonTags = book1.Tags.Intersect(book2.Tags).ToList();
        if (commonTags.Any())
        {
            reasons.Add($"tags similaires ({string.Join(", ", commonTags.Take(2))})");
        }

        var commonAuthors = book1.Authors.Intersect(book2.Authors).ToList();
        if (commonAuthors.Any())
        {
            reasons.Add($"même auteur ({string.Join(", ", commonAuthors)})");
        }

        return reasons.Any() ? string.Join(", ", reasons) : "livres similaires";
    }

    public async Task RecordInteractionAsync(Guid userId, Guid bookId, InteractionType type, int? rating = null)
    {
        var book = await _catalogService.GetBookByIdAsync(bookId);

        var interaction = new UserInteraction
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            BookId = bookId,
            InteractionType = type,
            Rating = rating,
            Tags = book != null ? JsonSerializer.Serialize(book.Tags) : null,
            Genre = book?.Genre,
            Language = book?.Language
        };

        _context.UserInteractions.Add(interaction);
        await _context.SaveChangesAsync();

        // Invalider le cache des recommandations pour cet utilisateur
        await _cache.RemoveAsync($"recommendations:{userId}:10");

        _logger.LogInformation("Recorded interaction: User {UserId}, Book {BookId}, Type {Type}",
            userId, bookId, type);
    }
}

