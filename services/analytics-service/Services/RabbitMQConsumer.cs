using AnalyticsService.Data;
using AnalyticsService.Domain;
using Microsoft.EntityFrameworkCore;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;
using System.Text.Json;

namespace AnalyticsService.Services;

public class RabbitMQConsumer : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<RabbitMQConsumer> _logger;
    private IConnection? _connection;
    private IModel? _channel;

    public RabbitMQConsumer(IServiceProvider serviceProvider, ILogger<RabbitMQConsumer> logger, IConfiguration configuration)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;

        try
        {
            var factory = new ConnectionFactory
            {
                HostName = configuration["RabbitMQ:HostName"] ?? "localhost",
                UserName = configuration["RabbitMQ:UserName"] ?? "guest",
                Password = configuration["RabbitMQ:Password"] ?? "guest"
            };

            _connection = factory.CreateConnection();
            _channel = _connection.CreateModel();
            _channel.ExchangeDeclare("elibrary.events", ExchangeType.Topic, durable: true);
            
            var queueName = _channel.QueueDeclare(
                queue: "analytics.events",
                durable: true,
                exclusive: false,
                autoDelete: false).QueueName;

            _channel.QueueBind(queueName, "elibrary.events", "book.*");
            _channel.QueueBind(queueName, "elibrary.events", "loan.*");
            _channel.QueueBind(queueName, "elibrary.events", "review.*");

            _logger.LogInformation("Connected to RabbitMQ and listening for events");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to connect to RabbitMQ");
        }
    }

    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (_channel == null)
        {
            return Task.CompletedTask;
        }

        var consumer = new EventingBasicConsumer(_channel);
        consumer.Received += async (model, ea) =>
        {
            try
            {
                var body = ea.Body.ToArray();
                var message = Encoding.UTF8.GetString(body);
                var eventData = JsonSerializer.Deserialize<EventMessage>(message);

                if (eventData != null)
                {
                    await ProcessEvent(eventData);
                }

                _channel.BasicAck(ea.DeliveryTag, false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing message");
                _channel.BasicNack(ea.DeliveryTag, false, true);
            }
        };

        _channel.BasicConsume(queue: "analytics.events", autoAck: false, consumer: consumer);
        
        return Task.CompletedTask;
    }

    private async Task ProcessEvent(EventMessage eventData)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AnalyticsDbContext>();

        try
        {
            switch (eventData.EventType)
            {
                case "BookImported":
                    await HandleBookImported(context, eventData);
                    break;
                case "BookBorrowed":
                    await HandleBookBorrowed(context, eventData);
                    break;
                case "BookReturned":
                    await HandleBookReturned(context, eventData);
                    break;
                case "ReviewAdded":
                    await HandleReviewAdded(context, eventData);
                    break;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing event {EventType}", eventData.EventType);
        }
    }

    private async Task HandleBookImported(AnalyticsDbContext context, EventMessage eventData)
    {
        var bookData = eventData.Data as JsonElement?;
        if (bookData == null) return;

        var bookId = Guid.Parse(bookData.Value.GetProperty("id").GetString() ?? Guid.NewGuid().ToString());
        var title = bookData.Value.GetProperty("title").GetString() ?? "";
        var genre = bookData.Value.TryGetProperty("genre", out var genreEl) ? genreEl.GetString() ?? "" : "";

        var stat = await context.BookStatistics.FirstOrDefaultAsync(b => b.BookId == bookId);
        
        if (stat == null)
        {
            stat = new BookStatistic
            {
                Id = Guid.NewGuid(),
                BookId = bookId,
                Title = title,
                Genre = genre
            };
            context.BookStatistics.Add(stat);
        }

        // Update genre statistics
        await UpdateGenreStatistics(context, genre, 1, 0);

        await context.SaveChangesAsync();
        _logger.LogInformation("Book imported tracked: {Title}", title);
    }

    private async Task HandleBookBorrowed(AnalyticsDbContext context, EventMessage eventData)
    {
        var loanData = eventData.Data as JsonElement?;
        if (loanData == null) return;

        var bookId = Guid.Parse(loanData.Value.GetProperty("bookId").GetString() ?? "");
        var userId = Guid.Parse(loanData.Value.GetProperty("userId").GetString() ?? "");
        var dueDate = DateTime.Parse(loanData.Value.GetProperty("dueDate").GetString() ?? DateTime.UtcNow.AddDays(14).ToString());

        var loanEvent = new LoanEvent
        {
            Id = Guid.NewGuid(),
            BookId = bookId,
            UserId = userId,
            EventType = "Borrowed",
            EventDate = DateTime.UtcNow,
            DueDate = dueDate
        };

        context.LoanEvents.Add(loanEvent);

        // Update book statistics
        var bookStat = await context.BookStatistics.FirstOrDefaultAsync(b => b.BookId == bookId);
        if (bookStat != null)
        {
            bookStat.LoanCount++;
            bookStat.LastUpdated = DateTime.UtcNow;
            
            // Update genre statistics
            await UpdateGenreStatistics(context, bookStat.Genre, 0, 1);
        }

        await context.SaveChangesAsync();
        _logger.LogInformation("Loan tracked for book {BookId}", bookId);
    }

    private async Task HandleBookReturned(AnalyticsDbContext context, EventMessage eventData)
    {
        var loanData = eventData.Data as JsonElement?;
        if (loanData == null) return;

        var bookId = Guid.Parse(loanData.Value.GetProperty("bookId").GetString() ?? "");
        
        var loanEvent = new LoanEvent
        {
            Id = Guid.NewGuid(),
            BookId = bookId,
            UserId = Guid.Empty,
            EventType = "Returned",
            EventDate = DateTime.UtcNow,
            ReturnDate = DateTime.UtcNow
        };

        context.LoanEvents.Add(loanEvent);
        await context.SaveChangesAsync();
    }

    private async Task HandleReviewAdded(AnalyticsDbContext context, EventMessage eventData)
    {
        var reviewData = eventData.Data as JsonElement?;
        if (reviewData == null) return;

        var bookId = Guid.Parse(reviewData.Value.GetProperty("bookId").GetString() ?? "");
        var rating = reviewData.Value.GetProperty("rating").GetDouble();

        var bookStat = await context.BookStatistics.FirstOrDefaultAsync(b => b.BookId == bookId);
        if (bookStat != null)
        {
            var currentTotal = bookStat.AverageRating * bookStat.ReviewCount;
            bookStat.ReviewCount++;
            bookStat.AverageRating = (currentTotal + rating) / bookStat.ReviewCount;
            bookStat.LastUpdated = DateTime.UtcNow;
            
            await context.SaveChangesAsync();
        }
    }

    private async Task UpdateGenreStatistics(AnalyticsDbContext context, string genre, int bookDelta, int loanDelta)
    {
        if (string.IsNullOrEmpty(genre)) return;

        var genreStat = await context.GenreStatistics.FirstOrDefaultAsync(g => g.Genre == genre);
        
        if (genreStat == null)
        {
            genreStat = new GenreStatistic
            {
                Id = Guid.NewGuid(),
                Genre = genre,
                BookCount = bookDelta,
                TotalLoans = loanDelta,
                ActiveLoans = loanDelta > 0 ? 1 : 0
            };
            context.GenreStatistics.Add(genreStat);
        }
        else
        {
            genreStat.BookCount += bookDelta;
            genreStat.TotalLoans += loanDelta;
            if (loanDelta > 0) genreStat.ActiveLoans++;
            genreStat.LastUpdated = DateTime.UtcNow;
        }
    }

    public override void Dispose()
    {
        _channel?.Close();
        _connection?.Close();
        base.Dispose();
    }
}

public class EventMessage
{
    public string EventType { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public object? Data { get; set; }
}

