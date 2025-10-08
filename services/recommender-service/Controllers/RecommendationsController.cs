using Microsoft.AspNetCore.Mvc;
using RecommenderService.Services;

namespace RecommenderService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RecommendationsController : ControllerBase
{
    private readonly RecommendationEngine _recommendationEngine;
    private readonly ILogger<RecommendationsController> _logger;

    public RecommendationsController(RecommendationEngine recommendationEngine, ILogger<RecommendationsController> logger)
    {
        _recommendationEngine = recommendationEngine;
        _logger = logger;
    }

    /// <summary>
    /// Obtenir des recommandations personnalisées pour un utilisateur
    /// </summary>
    [HttpGet("{userId}")]
    public async Task<IActionResult> GetRecommendations(Guid userId, [FromQuery] int limit = 10)
    {
        _logger.LogInformation("Getting recommendations for user {UserId}", userId);

        var recommendations = await _recommendationEngine.GetRecommendationsForUserAsync(userId, limit);

        return Ok(recommendations);
    }

    /// <summary>
    /// Obtenir des livres similaires à un livre donné
    /// </summary>
    [HttpGet("similar/{bookId}")]
    public async Task<IActionResult> GetSimilarBooks(Guid bookId, [FromQuery] int limit = 5)
    {
        _logger.LogInformation("Getting similar books for {BookId}", bookId);

        var similarBooks = await _recommendationEngine.GetSimilarBooksAsync(bookId, limit);

        if (!similarBooks.Any())
        {
            return NotFound(new { message = "No similar books found" });
        }

        return Ok(similarBooks);
    }

    /// <summary>
    /// Enregistrer une interaction utilisateur (pour tests/debug)
    /// </summary>
    [HttpPost("interactions")]
    public async Task<IActionResult> RecordInteraction([FromBody] InteractionRequest request)
    {
        await _recommendationEngine.RecordInteractionAsync(
            request.UserId,
            request.BookId,
            request.InteractionType,
            request.Rating
        );

        return Ok(new { message = "Interaction recorded successfully" });
    }
}

public record InteractionRequest(
    Guid UserId,
    Guid BookId,
    RecommenderService.Domain.InteractionType InteractionType,
    int? Rating = null
);

