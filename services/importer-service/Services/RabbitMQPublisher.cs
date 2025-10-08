using RabbitMQ.Client;
using System.Text;
using System.Text.Json;

namespace ImporterService.Services;

public class RabbitMQPublisher : IDisposable
{
    private readonly IConnection? _connection;
    private readonly IModel? _channel;
    private readonly ILogger<RabbitMQPublisher> _logger;

    public RabbitMQPublisher(IConfiguration configuration, ILogger<RabbitMQPublisher> logger)
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

    public void PublishBookImportedEvent(object bookData)
    {
        try
        {
            if (_channel == null)
            {
                return;
            }

            var message = JsonSerializer.Serialize(new
            {
                EventType = "BookImported",
                Timestamp = DateTime.UtcNow,
                Data = bookData
            });

            var body = Encoding.UTF8.GetBytes(message);
            var properties = _channel.CreateBasicProperties();
            properties.Persistent = true;

            _channel.BasicPublish(
                exchange: "elibrary.events",
                routingKey: "book.imported",
                basicProperties: properties,
                body: body);

            _logger.LogInformation("Published book imported event");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to publish event");
        }
    }

    public void Dispose()
    {
        _channel?.Close();
        _connection?.Close();
    }
}

