using CatalogService.Domain.Entities;

namespace CatalogService.DTOs;

public class LoanDto
{
    public Guid Id { get; set; }
    public Guid BookId { get; set; }
    public string BookTitle { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public DateTime LoanDate { get; set; }
    public DateTime DueDate { get; set; }
    public DateTime? ReturnDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool IsOverdue { get; set; }
    public int DaysOverdue { get; set; }
    public decimal LateFee { get; set; }
}

public class CreateLoanDto
{
    public Guid BookId { get; set; }
    public Guid UserId { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public int LoanDurationDays { get; set; } = 14;
}

public class ReturnLoanDto
{
    public string? Notes { get; set; }
}

