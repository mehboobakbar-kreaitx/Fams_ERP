using FAMS.Application.Common.Interfaces;
using FAMS.Application.Modules.Results.Commands.EnterMarks;
using FAMS.Domain.Entities;
using FAMS.Domain.Enums;
using FAMS.UnitTests.Infrastructure;
using Moq;
using ResultEntity = FAMS.Domain.Entities.Result;

namespace FAMS.UnitTests.Results;

public class EnterMarksCommandHandlerTests : IDisposable
{
    private readonly FAMS.Infrastructure.Persistence.FamsDbContext _db;
    private readonly Mock<ICurrentUserService> _currentUser = new();
    private readonly EnterMarksCommandHandler _handler;

    public EnterMarksCommandHandlerTests()
    {
        _db = TestDbContext.Create();
        _currentUser.Setup(x => x.UserId).Returns("test-user-id");
        _currentUser.Setup(x => x.UserName).Returns("Test User");
        _handler = new EnterMarksCommandHandler(_db, _currentUser.Object);
    }

    public void Dispose() => _db.Dispose();

    // ── helpers ───────────────────────────────────────────────────────────────

    private async Task<(Guid subjectId, Guid studentId)> SeedAsync()
    {
        var subject = Subject.Create("Mathematics", "MATH", 3, Guid.NewGuid());
        _db.Subjects.Add(subject);

        var student = Student.Create("Ali", "Khan", "Akbar Ali",
            new DateTime(2005, 1, 1), Gender.Male,
            "Karachi", "03001234567",
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            "R001", "Emergency", "03009876543");
        _db.Students.Add(student);

        await _db.SaveChangesAsync();
        return (subject.Id, student.Id);
    }

    private EnterMarksCommand MakeCommand(Guid subjectId, Guid studentId,
        decimal obtained = 75m, decimal total = 100m)
        => new(subjectId, "Midterm", "2026-T1", total,
               [new StudentMarkEntry(studentId, obtained)]);

    // ── validation ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_SubjectNotFound_ReturnsFailure()
    {
        var cmd = new EnterMarksCommand(Guid.NewGuid(), "Midterm", "2026-T1", 100m,
            [new StudentMarkEntry(Guid.NewGuid(), 50m)]);

        var result = await _handler.Handle(cmd, default);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("not found");
    }

    [Fact]
    public async Task Handle_UnknownStudent_ReturnsFailure()
    {
        var (subjectId, _) = await SeedAsync();

        var result = await _handler.Handle(
            new EnterMarksCommand(subjectId, "Midterm", "2026-T1", 100m,
                [new StudentMarkEntry(Guid.NewGuid(), 50m)]), default);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Unknown student");
    }

    [Fact]
    public async Task Handle_AlreadyPublished_ReturnsFailure()
    {
        var (subjectId, studentId) = await SeedAsync();

        var existing = ResultEntity.Create(studentId, subjectId, "Midterm", 80m, 100m, "2026-T1", "A");
        existing.Publish();
        _db.Results.Add(existing);
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(MakeCommand(subjectId, studentId), default);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("published");
    }

    // ── creation ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_NewEntry_CreatesResultWithCorrectGrade()
    {
        var (subjectId, studentId) = await SeedAsync();

        var result = await _handler.Handle(MakeCommand(subjectId, studentId, 75m, 100m), default);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().Be(1);
        _db.Results.First().Grade.Should().Be("B"); // 75% → B in built-in fallback scale
        _db.Results.First().IsPublished.Should().BeFalse();
    }

    // ── update with audit trail ───────────────────────────────────────────────

    [Fact]
    public async Task Handle_ExistingEntry_UpdatesMarksAndLogsMarksUpdatedAudit()
    {
        var (subjectId, studentId) = await SeedAsync();
        await _handler.Handle(MakeCommand(subjectId, studentId, 60m, 100m), default);

        var result = await _handler.Handle(MakeCommand(subjectId, studentId, 85m, 100m), default);

        result.IsSuccess.Should().BeTrue();
        _db.Results.First().MarksObtained.Should().Be(85m);
        _db.Results.First().Grade.Should().Be("A");

        // Handler explicitly creates a "MarksUpdated" log in addition to DbContext auto-audit
        var marksUpdatedLog = _db.AuditLogs.Single(a => a.Action == "MarksUpdated");
        marksUpdatedLog.UserId.Should().Be("test-user-id");
        marksUpdatedLog.EntityName.Should().Be("Result");
    }

    // ── fallback grade scale (no GradingScale seeded) ────────────────────────

    [Theory]
    [InlineData(95.0, 100.0, "A+")]
    [InlineData(90.0, 100.0, "A+")]
    [InlineData(89.0, 100.0, "A")]
    [InlineData(80.0, 100.0, "A")]
    [InlineData(79.0, 100.0, "B")]
    [InlineData(70.0, 100.0, "B")]
    [InlineData(69.0, 100.0, "C")]
    [InlineData(60.0, 100.0, "C")]
    [InlineData(59.0, 100.0, "D")]
    [InlineData(50.0, 100.0, "D")]
    [InlineData(49.0, 100.0, "F")]
    [InlineData(0.0,  100.0, "F")]
    public async Task Handle_FallbackGradeScale_AssignsCorrectGrade(
        double obtainedD, double totalD, string expected)
    {
        var obtained = (decimal)obtainedD;
        var total    = (decimal)totalD;
        var (subjectId, studentId) = await SeedAsync();

        await _handler.Handle(
            new EnterMarksCommand(subjectId, "Midterm", "2026-T1", total,
                [new StudentMarkEntry(studentId, obtained)]), default);

        _db.Results.First().Grade.Should().Be(expected);
    }

    // ── rounding ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_RoundingAppliedBeforeBoundary_ElevatesToNextGrade()
    {
        // 89.995 / 100 * 100 = 89.995
        // Math.Round(89.995, 2) with banker's rounding: digit at pos 2 is 9 (odd) → rounds up → 90.00
        // 90.00 >= 90 → "A+" not "A"
        var (subjectId, studentId) = await SeedAsync();

        await _handler.Handle(MakeCommand(subjectId, studentId, 89.995m, 100m), default);

        _db.Results.First().Grade.Should().Be("A+");
    }

    [Fact]
    public async Task Handle_ZeroTotalMarks_AssignsFGrade()
    {
        var (subjectId, studentId) = await SeedAsync();

        await _handler.Handle(MakeCommand(subjectId, studentId, 0m, 0m), default);

        _db.Results.First().Grade.Should().Be("F");
    }

    // ── custom DB grading scale ───────────────────────────────────────────────

    [Fact]
    public async Task Handle_WithCustomDbScale_PrefersScaleOverBuiltInFallback()
    {
        var (subjectId, studentId) = await SeedAsync();

        var scale = GradingScale.Create("Custom Scale");
        _db.GradingScales.Add(scale);
        await _db.SaveChangesAsync();

        _db.GradingScaleRules.Add(GradingScaleRule.Create(scale.Id, 75m, 100m, "PASS", 4.0m));
        _db.GradingScaleRules.Add(GradingScaleRule.Create(scale.Id, 0m, 74.99m, "FAIL", 0m));
        await _db.SaveChangesAsync();

        // 80% → should match "PASS" from scale, not "A" from built-in fallback
        await _handler.Handle(MakeCommand(subjectId, studentId, 80m, 100m), default);

        _db.Results.First().Grade.Should().Be("PASS");
    }

    [Fact]
    public async Task Handle_CustomScaleWithGap_UnmatchedPercentFallsToF()
    {
        var (subjectId, studentId) = await SeedAsync();

        var scale = GradingScale.Create("Gapped Scale");
        _db.GradingScales.Add(scale);
        await _db.SaveChangesAsync();

        // Only covers 61–100; 55% matches no rule → "F"
        _db.GradingScaleRules.Add(GradingScaleRule.Create(scale.Id, 61m, 100m, "PASS", 4.0m));
        await _db.SaveChangesAsync();

        await _handler.Handle(MakeCommand(subjectId, studentId, 55m, 100m), default);

        _db.Results.First().Grade.Should().Be("F");
    }
}
