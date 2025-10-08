using CatalogService.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CatalogService.Features.Books.Commands;

public record DeleteBookCommand(Guid Id) : IRequest<bool>;

public class DeleteBookCommandHandler : IRequestHandler<DeleteBookCommand, bool>
{
    private readonly CatalogDbContext _context;

    public DeleteBookCommandHandler(CatalogDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(DeleteBookCommand request, CancellationToken cancellationToken)
    {
        var book = await _context.Books.FindAsync(new object[] { request.Id }, cancellationToken);

        if (book == null)
        {
            return false;
        }

        _context.Books.Remove(book);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}

