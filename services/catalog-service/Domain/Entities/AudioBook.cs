namespace CatalogService.Domain.Entities;

public class AudioBook : Book
{
    public int Duration { get; set; }
    public string Narrator { get; set; } = string.Empty;
    public string AudioFormat { get; set; } = "MP3";
}

