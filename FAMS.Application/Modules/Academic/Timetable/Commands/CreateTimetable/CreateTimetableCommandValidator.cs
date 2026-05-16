using FluentValidation;

namespace FAMS.Application.Modules.Academic.Timetable.Commands.CreateTimetable;

public class CreateTimetableCommandValidator : AbstractValidator<CreateTimetableCommand>
{
    public CreateTimetableCommandValidator()
    {
        RuleFor(x => x.TermName).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Slots).NotEmpty();
        RuleForEach(x => x.Slots).ChildRules(s =>
        {
            s.RuleFor(x => x.SectionId).NotEmpty();
            s.RuleFor(x => x.SubjectId).NotEmpty();
            s.RuleFor(x => x.TeacherId).NotEmpty();
            s.RuleFor(x => x.StartTime).LessThan(x => x.EndTime)
                .WithMessage("StartTime must be before EndTime.");
        });
    }
}
