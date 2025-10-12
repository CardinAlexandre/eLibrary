using MediatR;
using Microsoft.EntityFrameworkCore;
using CatalogService.Data;
using CatalogService.Domain.Entities;
using CatalogService.DTOs;

namespace CatalogService.Features.Loans.Commands;

public class BorrowBookCommand : IRequest<LoanDto>
{
    public Guid BookId { get; set; }
    public Guid UserId { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public string? UserName { get; set; }
    public int LoanDurationDays { get; set; } = 14;
}

public class BorrowBookCommandHandler : IRequestHandler<BorrowBookCommand, LoanDto>
{
    private readonly CatalogDbContext _context;
    private readonly ILogger<BorrowBookCommandHandler> _logger;

    public BorrowBookCommandHandler(CatalogDbContext context, ILogger<BorrowBookCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<LoanDto> Handle(BorrowBookCommand request, CancellationToken cancellationToken)
    {
        var book = await _context.Books.FindAsync(new object[] { request.BookId }, cancellationToken);
        
        if (book == null)
        {
            throw new InvalidOperationException("Book not found");
        }

        if (book.CopiesAvailable <= 0)
        {
            throw new InvalidOperationException("No copies available for this book");
        }

        var existingLoan = await _context.Loans
            .FirstOrDefaultAsync(l => l.BookId == request.BookId && 
                                     l.UserId == request.UserId && 
                                     l.Status == LoanStatus.Active, 
                                cancellationToken);

        if (existingLoan != null)
        {
            throw new InvalidOperationException("You already have an active loan for this book");
        }

        var loan = new Loan
        {
            Id = Guid.NewGuid(),
            BookId = request.BookId,
            UserId = request.UserId,
            UserEmail = request.UserEmail,
            UserName = request.UserName,
            LoanDate = DateTime.UtcNow,
            DueDate = DateTime.UtcNow.AddDays(request.LoanDurationDays),
            Status = LoanStatus.Active
        };

        _context.Loans.Add(loan);
        
        book.CopiesAvailable--;
        if (book.CopiesAvailable == 0)
        {
            book.IsAvailable = false;
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Book {BookId} borrowed by user {UserId}", request.BookId, request.UserId);

        return MapToDto(loan, book.Title);
    }

    private static LoanDto MapToDto(Loan loan, string bookTitle)
    {
        return new LoanDto
        {
            Id = loan.Id,
            BookId = loan.BookId,
            BookTitle = bookTitle,
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

