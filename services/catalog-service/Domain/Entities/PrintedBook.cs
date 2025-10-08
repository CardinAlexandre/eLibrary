namespace CatalogService.Domain.Entities;

public class PrintedBook : Book
{
    public string Publisher { get; set; } = string.Empty;
    public string Edition { get; set; } = string.Empty;
    public string Format { get; set; } = "Hardcover"; // Hardcover, Paperback, etc.
    public double Weight { get; set; } // in grams
    public string Dimensions { get; set; } = string.Empty; // e.g., "20x15x3 cm"
}

