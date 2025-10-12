using RabbitMQ.Client;
using System.Text;
using System.Text.Json;

namespace CatalogService.Infrastructure;

public class RabbitMQService : IDisposable
{
    private readonly IConnection? _connection;
    private readonly IModel? _channel;
    private readonly ILogger<RabbitMQService> _logger;

    public RabbitMQService(IConfiguration configuration, ILogger<RabbitMQService> logger)
    {
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

            _logger.LogInformation("Connected to RabbitMQ");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to connect to RabbitMQ");
        }
    }

    public void PublishEvent<T>(string routingKey, T @event)
    {
        try
        {
            if (_channel == null)
            {
                _logger.LogWarning("RabbitMQ channel is not available");
                return;
            }

            var message = JsonSerializer.Serialize(@event);
            var body = Encoding.UTF8.GetBytes(message);

            var properties = _channel.CreateBasicProperties();
            properties.Persistent = true;
            properties.ContentType = "application/json";

            _channel.BasicPublish(
                exchange: "elibrary.events",
                routingKey: routingKey,
                basicProperties: properties,
                body: body);

            _logger.LogInformation("Published event to {RoutingKey}: {Message}", routingKey, message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to publish event to {RoutingKey}", routingKey);
        }
    }

    public void Dispose()
    {
        _channel?.Close();
        _connection?.Close();
    }
}

