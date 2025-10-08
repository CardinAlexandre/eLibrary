using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using RecommenderService.Domain;
using System.Text;
using System.Text.Json;

namespace RecommenderService.Services;

public class RabbitMQConsumer : BackgroundService
{
    private readonly ILogger<RabbitMQConsumer> _logger;
    private readonly IServiceProvider _serviceProvider;
    private IConnection? _connection;
    private IModel? _channel;

    public RabbitMQConsumer(IConfiguration configuration, ILogger<RabbitMQConsumer> logger, IServiceProvider serviceProvider)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;

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

            var queueName = _channel.QueueDeclare("recommender.events", durable: true, exclusive: false, autoDelete: false).QueueName;

            _channel.QueueBind(queueName, "elibrary.events", "book.borrowed");
            _channel.QueueBind(queueName, "elibrary.events", "book.returned");
            _channel.QueueBind(queueName, "elibrary.events", "review.added");

            _logger.LogInformation("Connected to RabbitMQ and subscribed to events");
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
                var routingKey = ea.RoutingKey;

                _logger.LogInformation("Received event: {RoutingKey}", routingKey);

                await ProcessEventAsync(routingKey, message);

                _channel.BasicAck(ea.DeliveryTag, false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing RabbitMQ message");
                _channel.BasicNack(ea.DeliveryTag, false, true);
            }
        };

        _channel.BasicConsume(queue: "recommender.events", autoAck: false, consumer: consumer);

        return Task.CompletedTask;
    }

    private async Task ProcessEventAsync(string routingKey, string message)
    {
        using var scope = _serviceProvider.CreateScope();
        var recommendationEngine = scope.ServiceProvider.GetRequiredService<RecommendationEngine>();

        var @event = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(message);
        if (@event == null)
        {
            return;
        }

        switch (routingKey)
        {
            case "book.borrowed":
                if (@event.TryGetValue("userId", out var userId) && @event.TryGetValue("bookId", out var bookId))
                {
                    await recommendationEngine.RecordInteractionAsync(
                        Guid.Parse(userId.GetString()!),
                        Guid.Parse(bookId.GetString()!),
                        InteractionType.Borrow
                    );
                }
                break;

            case "review.added":
                if (@event.TryGetValue("userId", out var reviewUserId) &&
                    @event.TryGetValue("bookId", out var reviewBookId) &&
                    @event.TryGetValue("rating", out var rating))
                {
                    await recommendationEngine.RecordInteractionAsync(
                        Guid.Parse(reviewUserId.GetString()!),
                        Guid.Parse(reviewBookId.GetString()!),
                        InteractionType.Review,
                        rating.GetInt32()
                    );
                }
                break;
        }
    }

    public override void Dispose()
    {
        _channel?.Close();
        _connection?.Close();
        base.Dispose();
    }
}

