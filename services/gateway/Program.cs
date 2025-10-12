using Gateway.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Prometheus;
using Serilog;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();

var jwtSettings = builder.Configuration.GetSection("JwtSettings");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings["Secret"] ?? "SuperSecretKeyForJWTTokenGeneration2025!"))
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddSingleton<WebSocketNotificationService>();

builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddHealthChecks();

var app = builder.Build();

app.UseWebSockets(new WebSocketOptions
{
    KeepAliveInterval = TimeSpan.FromSeconds(120)
});

app.UseSerilogRequestLogging();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.UseHttpMetrics();

app.Map("/ws", async context =>
{
    var notificationService = context.RequestServices.GetRequiredService<WebSocketNotificationService>();
    var connectionId = context.Request.Query["connectionId"].FirstOrDefault() ?? Guid.NewGuid().ToString();
    await notificationService.HandleWebSocketAsync(context, connectionId);
});

app.MapPost("/api/notifications/send", async (WebSocketNotificationService service, NotificationRequest request) =>
{
    await service.BroadcastAsync(new
    {
        type = request.Type,
        message = request.Message,
        timestamp = DateTime.UtcNow
    });
    return Results.Ok(new { sent = true, activeConnections = service.GetActiveConnectionsCount() });
}).RequireAuthorization();

app.MapGet("/api/notifications/connections", (WebSocketNotificationService service) =>
{
    return Results.Ok(new { activeConnections = service.GetActiveConnectionsCount() });
});

app.MapReverseProxy();
app.MapHealthChecks("/health");
app.MapMetrics();

app.Run();

public record NotificationRequest(string Type, string Message);

