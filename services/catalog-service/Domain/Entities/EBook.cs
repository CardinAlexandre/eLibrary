namespace CatalogService.Domain.Entities;

public class EBook : Book
{
    public string Format { get; set; } = "EPUB";
    public long FileSize { get; set; }
    public bool Drm { get; set; }
}

