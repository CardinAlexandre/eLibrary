using MediatR;
using Microsoft.EntityFrameworkCore;
using CatalogService.Data;
using CatalogService.Domain.Entities;
using CatalogService.DTOs;

namespace CatalogService.Features.Loans.Queries;

public class GetUserLoansQuery : IRequest<List<LoanDto>>
{
    public Guid UserId { get; set; }
    public string? Status { get; set; }
}

public class GetUserLoansQueryHandler : IRequestHandler<GetUserLoansQuery, List<LoanDto>>
{
    private readonly CatalogDbContext _context;

    public GetUserLoansQueryHandler(CatalogDbContext context)
    {
        _context = context;
    }

    public async Task<List<LoanDto>> Handle(GetUserLoansQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Loans
            .Include(l => l.Book)
            .Where(l => l.UserId == request.UserId);

        if (!string.IsNullOrEmpty(request.Status))
        {
            if (Enum.TryParse<LoanStatus>(request.Status, true, out var status))
            {
                query = query.Where(l => l.Status == status);
            }
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

