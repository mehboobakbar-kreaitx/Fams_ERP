using FluentValidation;

namespace FAMS.Application.Modules.Academic.Examinations.Commands.CreateExamSchedule;

public class CreateExamScheduleCommandValidator : AbstractValidator<CreateExamScheduleCommand>
{
    public CreateExamScheduleCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
        RuleFor(x => x.ExamType).NotEmpty().MaximumLength(50);
        RuleFor(x => x.TermName).NotEmpty().MaximumLength(50);
        RuleFor(x => x.ClassId).NotEmpty();
        RuleFor(x => x.EndDate).GreaterThanOrEqualTo(x => x.StartDate);
        RuleFor(x => x.Items).NotEmpty();
        RuleForEach(x => x.Items).ChildRules(i =>
        {
            i.RuleFor(it => it.SubjectId).NotEmpty();
            i.RuleFor(it => it.TotalMarks).GreaterThan(0);
            i.RuleFor(it => it.StartTime).LessThan(it => it.EndTime);
        });
        RuleFor(x => x).Custom((cmd, ctx) =>
        {
            foreach (var item in cmd.Items)
            {
                if (item.ExamDate.Date < cmd.StartDate.Date || item.ExamDate.Date > cmd.EndDate.Date)
                    ctx.AddFailure($"Exam item for subject {item.SubjectId} is outside the exam window.");
            }
            var dupes = cmd.Items.GroupBy(i => i.SubjectId).Where(g => g.Count() > 1).ToList();
            foreach (var dup in dupes)
                ctx.AddFailure($"Subject {dup.Key} appears more than once in the schedule.");
        });
    }
}
