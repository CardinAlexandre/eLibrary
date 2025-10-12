namespace CatalogService.Domain.Entities;

public class PrintedBook : Book
{
    public string Publisher { get; set; } = string.Empty;
    public string Edition { get; set; } = string.Empty;
    public string Format { get; set; } = "Hardcover"; 
    public double Weight { get; set; } 
    public string Dimensions { get; set; } = string.Empty; 
}

