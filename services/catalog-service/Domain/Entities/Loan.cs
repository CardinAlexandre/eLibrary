namespace CatalogService.Domain.Entities;

public class Loan
{
    public Guid Id { get; set; }
    public Guid BookId { get; set; }
    public Guid UserId { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public string? UserName { get; set; }
    public DateTime LoanDate { get; set; } = DateTime.UtcNow;
    public DateTime DueDate { get; set; }
    public DateTime? ReturnDate { get; set; }
    public LoanStatus Status { get; set; } = LoanStatus.Active;
    public string? Notes { get; set; }

    public virtual Book? Book { get; set; }

    public bool IsOverdue => Status == LoanStatus.Active && DateTime.UtcNow > DueDate;
    public int DaysOverdue => IsOverdue ? (DateTime.UtcNow - DueDate).Days : 0;
    public decimal LateFee => DaysOverdue * 0.5m;
}

public enum LoanStatus
{
    Active,
    Returned,
    Overdue,
    Lost
}

