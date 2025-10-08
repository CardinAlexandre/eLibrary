using DotNetEnv;

// Charger les variables d'environnement depuis le fichier .env à la racine du projet
var envPath = FindEnvFile();
if (envPath != null)
{
    Env.Load(envPath);
}

static string? FindEnvFile()
{
    var currentDirectory = new DirectoryInfo(Directory.GetCurrentDirectory());
    
    while (currentDirectory != null)
    {
        var envFilePath = Path.Combine(currentDirectory.FullName, ".env");
        if (File.Exists(envFilePath))
        {
            return envFilePath;
        }
        
        currentDirectory = currentDirectory.Parent;
    }
    
    return null;
}

var builder = WebApplication.CreateBuilder(args);

// Configurer la chaîne de connexion depuis les variables d'environnement
var connectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING");
if (!string.IsNullOrEmpty(connectionString))
{
    builder.Configuration["ConnectionStrings:DefaultConnection"] = connectionString;
}

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast =  Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast")
.WithOpenApi();

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC * 1.8);
}
