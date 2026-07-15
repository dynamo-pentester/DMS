using FluentValidation;
using DriverDms.Application.DTOs;

namespace DriverDms.Application.Validators;

public class CreateDriverRequestValidator : AbstractValidator<CreateDriverRequest>
{
    public CreateDriverRequestValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Mobile).NotEmpty().Matches(@"^\+?[0-9]{7,15}$");
        RuleFor(x => x.DateOfBirth).LessThanOrEqualTo(DateTime.UtcNow)
            .WithMessage("Date of birth cannot be in the future.");
        RuleFor(x => x.AadhaarNo).Length(12).When(x => !string.IsNullOrEmpty(x.AadhaarNo))
            .WithMessage("Aadhaar number must be 12 digits if provided.");
    }
}
