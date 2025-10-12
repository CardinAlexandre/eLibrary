namespace AnalyticsService.Domain;

public class LoanEvent
{
    public Guid Id { get; set; }
    public Guid BookId { get; set; }
    public Guid UserId { get; set; }
    public string EventType { get; set; } = string.Empty;
    public DateTime EventDate { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? ReturnDate { get; set; }
}

