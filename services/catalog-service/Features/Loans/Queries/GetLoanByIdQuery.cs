using MediatR;
using Microsoft.EntityFrameworkCore;
using CatalogService.Data;
using CatalogService.Domain.Entities;
using CatalogService.DTOs;

namespace CatalogService.Features.Loans.Queries;

public class GetLoanByIdQuery : IRequest<LoanDto?>
{
    public Guid LoanId { get; set; }
}

public class GetLoanByIdQueryHandler : IRequestHandler<GetLoanByIdQuery, LoanDto?>
{
    private readonly CatalogDbContext _context;

    public GetLoanByIdQueryHandler(CatalogDbContext context)
    {
        _context = context;
    }

    public async Task<LoanDto?> Handle(GetLoanByIdQuery request, CancellationToken cancellationToken)
    {
        var loan = await _context.Loans
            .Include(l => l.Book)
            .FirstOrDefaultAsync(l => l.Id == request.LoanId, cancellationToken);

        if (loan == null)
        {
            return null;
        }

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

