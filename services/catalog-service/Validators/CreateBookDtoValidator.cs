using CatalogService.DTOs;
using FluentValidation;

namespace CatalogService.Validators;

public class CreateBookDtoValidator : AbstractValidator<CreateBookDto>
{
    public CreateBookDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required")
            .MaximumLength(500).WithMessage("Title must not exceed 500 characters");

        RuleFor(x => x.Authors)
            .NotEmpty().WithMessage("At least one author is required");

        RuleFor(x => x.Isbn)
            .NotEmpty().WithMessage("ISBN is required")
            .Matches(@"^(?:\d{10}|\d{13}|97[89]\d{10})$").WithMessage("Invalid ISBN format");

        RuleFor(x => x.BookType)
            .NotEmpty().WithMessage("Book type is required")
            .Must(x => x == "PrintedBook" || x == "EBook" || x == "AudioBook")
            .WithMessage("Book type must be PrintedBook, EBook, or AudioBook");

        RuleFor(x => x.Pages)
            .GreaterThan(0).WithMessage("Pages must be greater than 0");

        RuleFor(x => x.Language)
            .NotEmpty().WithMessage("Language is required")
            .Length(2, 10).WithMessage("Language must be between 2 and 10 characters");

        RuleFor(x => x.Genre)
            .NotEmpty().WithMessage("Genre is required");
    }
}

