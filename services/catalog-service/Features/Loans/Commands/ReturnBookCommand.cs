using MediatR;
using Microsoft.EntityFrameworkCore;
using CatalogService.Data;
using CatalogService.Domain.Entities;
using CatalogService.DTOs;

namespace CatalogService.Features.Loans.Commands;

public class ReturnBookCommand : IRequest<LoanDto>
{
    public Guid LoanId { get; set; }
    public Guid UserId { get; set; }
    public string? Notes { get; set; }
}

public class ReturnBookCommandHandler : IRequestHandler<ReturnBookCommand, LoanDto>
{
    private readonly CatalogDbContext _context;
    private readonly ILogger<ReturnBookCommandHandler> _logger;

    public ReturnBookCommandHandler(CatalogDbContext context, ILogger<ReturnBookCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<LoanDto> Handle(ReturnBookCommand request, CancellationToken cancellationToken)
    {
        var loan = await _context.Loans
            .Include(l => l.Book)
            .FirstOrDefaultAsync(l => l.Id == request.LoanId, cancellationToken);

        if (loan == null)
        {
            throw new InvalidOperationException("Loan not found");
        }

        if (loan.UserId != request.UserId)
        {
            throw new InvalidOperationException("You cannot return a loan that is not yours");
        }

        if (loan.Status != LoanStatus.Active && loan.Status != LoanStatus.Overdue)
        {
            throw new InvalidOperationException("This loan has already been returned");
        }

        loan.ReturnDate = DateTime.UtcNow;
        loan.Status = LoanStatus.Returned;
        loan.Notes = request.Notes;

        if (loan.Book != null)
        {
            loan.Book.CopiesAvailable++;
            loan.Book.IsAvailable = true;
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Book {BookId} returned by user {UserId}", loan.BookId, request.UserId);

        return MapToDto(loan);
    }

    private static LoanDto MapToDto(Loan loan)
    {
        return new LoanDto
        {
            Id = loan.Id,
            BookId = loan.BookId,
            BookTitle = loan.Book?.Title ?? string.Empty,
            UserId = loan.UserId,
            UserEmail = loan.UserEmail,
            UserName = loan.UserName,
            LoanDate = loan.LoanDate,
            DueDate = loan.DueDate,
            ReturnDate = loan.ReturnDate,
            Status = loan.Status.ToString(),
            IsOverdue = loan.IsOverdue,
            DaysOverdue = loan.DaysOverdue,
            LateFee = loan.LateFee
        };
    }
}

