using FluentValidation;

namespace FAMS.Application.Modules.Results.Commands.EnterMarks;

public class EnterMarksCommandValidator : AbstractValidator<EnterMarksCommand>
{
    public EnterMarksCommandValidator()
    {
        RuleFor(x => x.SubjectId).NotEmpty();
        RuleFor(x => x.ExamType).NotEmpty().MaximumLength(50);
        RuleFor(x => x.TermName).NotEmpty().MaximumLength(50);
        RuleFor(x => x.TotalMarks).GreaterThan(0).LessThanOrEqualTo(1000);
        RuleFor(x => x.Entries).NotEmpty().WithMessage("At least one student mark entry is required.");
        RuleForEach(x => x.Entries).ChildRules(entry =>
        {
            entry.RuleFor(e => e.StudentId).NotEmpty();
            entry.RuleFor(e => e.MarksObtained).GreaterThanOrEqualTo(0);
        });
        RuleFor(x => x).Custom((cmd, ctx) =>
        {
            foreach (var entry in cmd.Entries)
            {
                if (entry.MarksObtained > cmd.TotalMarks)
                    ctx.AddFailure($"Student {entry.StudentId}: marks {entry.MarksObtained} exceed total {cmd.TotalMarks}.");
            }
        });
    }
}
