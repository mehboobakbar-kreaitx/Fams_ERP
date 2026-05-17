using FAMS.Application.Modules.Results.Queries.GetStudentResults;
using FAMS.Domain.Entities;
using FAMS.Domain.Enums;
using FAMS.UnitTests.Infrastructure;
using ResultEntity = FAMS.Domain.Entities.Result;

namespace FAMS.UnitTests.Results;

/// <summary>Verifies the EF-layer campus filter that enforces tenant isolation on results queries.</summary>
public class GetStudentResultsQueryHandlerTests : IDisposable
{
    private readonly FAMS.Infrastructure.Persistence.FamsDbContext _db;
    private readonly GetStudentResultsQueryHandler _handler;

    private static readonly Guid CampusA = Guid.NewGuid();
    private static readonly Guid CampusB = Guid.NewGuid();

    public GetStudentResultsQueryHandlerTests()
    {
        _db = TestDbContext.Create();
        _handler = new GetStudentResultsQueryHandler(_db);
    }

    public void Dispose() => _db.Dispose();

    private async Task<(Guid studentId, Guid subjectId)> SeedResultsAsync()
    {
        var subject = Subject.Create("Physics", "PHY", 3, Guid.NewGuid());
        _db.Subjects.Add(subject);

        var student = Student.Create("Sara", "Ahmed", "Father",
            new DateTime(2006, 3, 15), Gender.Female,
            "Lahore", "03111234567",
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            "R-99", "EC", "03119876543");
        _db.Students.Add(student);

        await _db.SaveChangesAsync();

        // Two results for same student: one in campus A, one in campus B
        var r1 = ResultEntity.Create(student.Id, subject.Id, "Midterm", 80m, 100m, "2026-T1", "A");
        r1.CampusId = CampusA;
        r1.Publish();

        var r2 = ResultEntity.Create(student.Id, subject.Id, "Final", 70m, 100m, "2026-T1", "B");
        r2.CampusId = CampusB;
        r2.Publish();

        _db.Results.AddRange(r1, r2);
        await _db.SaveChangesAsync();

        return (student.Id, subject.Id);
    }

    [Fact]
    public async Task Handle_NoCampusFilter_ReturnsAllPublishedResults()
    {
        var (studentId, _) = await SeedResultsAsync();

        var result = await _handler.Handle(
            new GetStudentResultsQuery(studentId, PublishedOnly: true, CampusId: null), default);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().HaveCount(2);
    }

    [Fact]
    public async Task Handle_CampusAFilter_ReturnsOnlyCampusAResults()
    {
        var (studentId, _) = await SeedResultsAsync();

        var result = await _handler.Handle(
            new GetStudentResultsQuery(studentId, PublishedOnly: true, CampusId: CampusA), default);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().HaveCount(1);
        result.Value![0].ExamType.Should().Be("Midterm"); // campus A has Midterm
    }

    [Fact]
    public async Task Handle_CampusBFilter_ReturnsCampusBResultsOnly()
    {
        var (studentId, _) = await SeedResultsAsync();

        var result = await _handler.Handle(
            new GetStudentResultsQuery(studentId, PublishedOnly: true, CampusId: CampusB), default);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().HaveCount(1);
        result.Value![0].ExamType.Should().Be("Final"); // campus B has Final
    }

    [Fact]
    public async Task Handle_UnrelatedCampusFilter_ReturnsEmpty()
    {
        var (studentId, _) = await SeedResultsAsync();
        var campusC = Guid.NewGuid();

        var result = await _handler.Handle(
            new GetStudentResultsQuery(studentId, PublishedOnly: true, CampusId: campusC), default);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().BeEmpty();
    }
}
