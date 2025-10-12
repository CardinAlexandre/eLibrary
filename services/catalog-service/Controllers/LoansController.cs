using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CatalogService.DTOs;
using CatalogService.Features.Loans.Commands;
using CatalogService.Features.Loans.Queries;

namespace CatalogService.Controllers;

[ApiController]
[Route("api/catalog/[controller]")]
public class LoansController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<LoansController> _logger;

    public LoansController(IMediator mediator, ILogger<LoansController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<LoanDto>> BorrowBook([FromBody] CreateLoanDto dto)
    {
        try
        {
            var userId = User.FindFirst("userId")?.Value;
            var userEmail = User.FindFirst("email")?.Value ?? User.Identity?.Name ?? "";
            var firstName = User.FindFirst("firstName")?.Value;
            var lastName = User.FindFirst("lastName")?.Value;

            _logger.LogInformation("BorrowBook - UserId: {UserId}, Email: {Email}, FirstName: {FirstName}, LastName: {LastName}", 
                userId, userEmail, firstName, lastName);

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User ID not found in token");
            }

            dto.UserId = Guid.Parse(userId);
            dto.UserEmail = userEmail;

            string? userName = null;
            if (!string.IsNullOrEmpty(firstName) || !string.IsNullOrEmpty(lastName))
            {
                userName = $"{firstName} {lastName}".Trim();
            }
            
            if (string.IsNullOrEmpty(userName))
            {
                userName = userEmail;
            }

            _logger.LogInformation("UserName constructed: {UserName}", userName);

            var command = new BorrowBookCommand
            {
                BookId = dto.BookId,
                UserId = dto.UserId,
                UserEmail = dto.UserEmail,
                UserName = userName,
                LoanDurationDays = dto.LoanDurationDays
            };

            var result = await _mediator.Send(command);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error borrowing book");
            return StatusCode(500, new { error = "An error occurred while borrowing the book" });
        }
    }

    [HttpPost("{id}/return")]
    [Authorize]
    public async Task<ActionResult<LoanDto>> ReturnBook(Guid id, [FromBody] ReturnLoanDto dto)
    {
        try
        {
            var userId = User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User ID not found in token");
            }

            var command = new ReturnBookCommand
            {
                LoanId = id,
                UserId = Guid.Parse(userId),
                Notes = dto.Notes
            };

            var result = await _mediator.Send(command);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error returning book");
            return StatusCode(500, new { error = "An error occurred while returning the book" });
        }
    }

    [HttpGet("my-loans")]
    [Authorize]
    public async Task<ActionResult<List<LoanDto>>> GetMyLoans([FromQuery] string? status = null)
    {
        try
        {
            var userId = User.FindFirst("userId")?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User ID not found in token");
            }

            var query = new GetUserLoansQuery
            {
                UserId = Guid.Parse(userId),
                Status = status
            };

            var result = await _mediator.Send(query);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user loans");
            return StatusCode(500, new { error = "An error occurred while fetching loans" });
        }
    }

    [HttpGet("book/{bookId}")]
    public async Task<ActionResult<List<LoanDto>>> GetBookLoans(Guid bookId, [FromQuery] bool activeOnly = true)
    {
        try
        {
            var query = new GetBookLoansQuery
            {
                BookId = bookId,
                ActiveOnly = activeOnly
            };

            var result = await _mediator.Send(query);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting book loans");
            return StatusCode(500, new { error = "An error occurred while fetching loans" });
        }
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<LoanDto>> GetLoanById(Guid id)
    {
        try
        {
            var query = new GetLoanByIdQuery { LoanId = id };
            var result = await _mediator.Send(query);

            if (result == null)
            {
                return NotFound();
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting loan");
            return StatusCode(500, new { error = "An error occurred while fetching the loan" });
        }
    }
}

