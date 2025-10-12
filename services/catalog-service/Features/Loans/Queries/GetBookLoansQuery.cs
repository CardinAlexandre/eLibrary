using MediatR;
using Microsoft.EntityFrameworkCore;
using CatalogService.Data;
using CatalogService.Domain.Entities;
using CatalogService.DTOs;

namespace CatalogService.Features.Loans.Queries;

public class GetBookLoansQuery : IRequest<List<LoanDto>>
{
    public Guid BookId { get; set; }
    public bool ActiveOnly { get; set; } = true;
}

public class GetBookLoansQueryHandler : IRequestHandler<GetBookLoansQuery, List<LoanDto>>
{
    private readonly CatalogDbContext _context;

    public GetBookLoansQueryHandler(CatalogDbContext context)
    {
        _context = context;
    }

    public async Task<List<LoanDto>> Handle(GetBookLoansQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Loans
            .Include(l => l.Book)
            .Where(l => l.BookId == request.BookId);

        if (request.ActiveOnly)
        {
            query = query.Where(l => l.Status == LoanStatus.Active || l.Status == LoanStatus.Overdue);
        }

        var loans = await query
            .OrderByDescending(l => l.LoanDate)
            .ToListAsync(cancellationToken);

        return loans.Select(MapToDto).ToList();
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

