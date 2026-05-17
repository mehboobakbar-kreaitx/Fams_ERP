using FAMS.Application.Common.Exceptions;
using FAMS.Application.Common.Interfaces;
using FAMS.Application.Modules.Admissions.Commands.EnrollApplicant;
using FAMS.Domain.Entities;
using FAMS.Domain.Enums;
using FAMS.UnitTests.Infrastructure;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using AppEntity = FAMS.Domain.Entities.Application;

namespace FAMS.UnitTests.Admissions;

public class EnrollApplicantCommandHandlerTests : IDisposable
{
    private readonly FAMS.Infrastructure.Persistence.FamsDbContext _db;
    private readonly Mock<IIdentityService> _identity = new();
    private readonly Mock<IEmailService> _email = new();
    private readonly EnrollApplicantCommandHandler _handler;

    private readonly Guid _campusId  = Guid.NewGuid();
    private readonly Guid _classId   = Guid.NewGuid();
    private readonly Guid _sectionId = Guid.NewGuid();

    public EnrollApplicantCommandHandlerTests()
    {
        _db = TestDbContext.Create();

        _identity
            .Setup(x => x.FindByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync((AppUserDto?)null);

        _identity
            .Setup(x => x.CreateUserAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<Guid?>(), It.IsAny<Guid>(), It.IsAny<string>()))
            .ReturnsAsync((true, "new-user-id", (string?)null));

        _email
            .Setup(x => x.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _handler = new EnrollApplicantCommandHandler(
            _db, _identity.Object, _email.Object,
            NullLogger<EnrollApplicantCommandHandler>.Instance);
    }

    public void Dispose() => _db.Dispose();

    // ── helpers ───────────────────────────────────────────────────────────────

    private async Task<Guid> SeedOfferedApplicationAsync()
    {
        var app = AppEntity.Create(
            "Ali", "Khan", "Father Ali",
            new DateTime(2005, 1, 1), Gender.Male,
            "03001234567", "ali.enroll@test.com", "Karachi",
            Guid.NewGuid(), _campusId);
        app.Review(ApplicationStatus.Offered, "Interview passed", Guid.Empty);
        _db.Applications.Add(app);
        await _db.SaveChangesAsync();
        return app.Id;
    }

    private EnrollApplicantCommand MakeCommand(Guid applicationId,
        string rollNumber = "R-2026-001",
        string? parentCnic = null,
        string? parentEmail = null)
        => new(
            applicationId, _classId, _sectionId, rollNumber,
            "Emergency Contact", "03009876543",
            parentCnic is not null ? "Ahmed" : null,
            parentCnic is not null ? "Khan" : null,
            parentCnic,
            parentCnic is not null ? "03001234567" : null,
            parentEmail,
            parentCnic is not null ? "Father" : null,
            parentCnic is not null ? "Karachi" : null);

    // ── validation ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_ApplicationNotFound_ThrowsNotFoundException()
    {
        var act = () => _handler.Handle(MakeCommand(Guid.NewGuid()), default);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Handle_ApplicationNotOffered_ReturnsFailure()
    {
        var app = AppEntity.Create(
            "Ali", "Khan", "Father",
            new DateTime(2005, 1, 1), Gender.Male,
            "03001234567", "ali@test.com", "Karachi",
            Guid.NewGuid(), _campusId);
        // Status stays as Applied (not Offered)
        _db.Applications.Add(app);
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(MakeCommand(app.Id), default);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("Offered");
    }

    [Fact]
    public async Task Handle_DuplicateRollNumber_ReturnsFailure()
    {
        var applicationId = await SeedOfferedApplicationAsync();

        var existing = Student.Create("Other", "Student", "Father",
            new DateTime(2005, 1, 1), Gender.Male,
            "Karachi", "03001111111",
            Guid.NewGuid(), _classId, _sectionId, "R-2026-001", "EC", "03001111111");
        existing.CampusId = _campusId;
        _db.Students.Add(existing);
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(MakeCommand(applicationId, rollNumber: "R-2026-001"), default);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("already exists");
    }

    // ── happy path ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_ValidEnrollment_CreatesStudentInCorrectCampus()
    {
        var applicationId = await SeedOfferedApplicationAsync();

        var result = await _handler.Handle(MakeCommand(applicationId), default);

        result.IsSuccess.Should().BeTrue();
        var student = _db.Students.First();
        student.FirstName.Should().Be("Ali");
        student.CampusId.Should().Be(_campusId);
    }

    [Fact]
    public async Task Handle_ValidEnrollment_SetsApplicationStatusToEnrolled()
    {
        var applicationId = await SeedOfferedApplicationAsync();

        await _handler.Handle(MakeCommand(applicationId), default);

        var app = await _db.Applications.FindAsync(applicationId);
        app!.Status.Should().Be(ApplicationStatus.Enrolled);
    }

    [Fact]
    public async Task Handle_ValidEnrollment_AttemptsStudentPortalCreation()
    {
        var applicationId = await SeedOfferedApplicationAsync();

        await _handler.Handle(MakeCommand(applicationId), default);

        _identity.Verify(x => x.CreateUserAsync(
            "ali.enroll@test.com", It.IsAny<string>(),
            It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<Guid?>(), _campusId, "Student"), Times.Once);
    }

    // ── parent linkage ────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_WithParentCnic_CreatesParentAndLinksToStudent()
    {
        var applicationId = await SeedOfferedApplicationAsync();

        var result = await _handler.Handle(
            MakeCommand(applicationId, parentCnic: "12345-1234567-1", parentEmail: "parent@test.com"),
            default);

        result.IsSuccess.Should().BeTrue();
        _db.Parents.Should().HaveCount(1);
        _db.Students.First().ParentId.Should().NotBeNull();
    }

    [Fact]
    public async Task Handle_ExistingParentByCnic_ReusesParentNoDuplicate()
    {
        var applicationId = await SeedOfferedApplicationAsync();

        var existingParent = Parent.Create("Ahmed", "Khan", "12345-1234567-1",
            "03001234567", "Karachi", "Father", "parent@test.com");
        existingParent.CampusId = _campusId;
        _db.Parents.Add(existingParent);
        await _db.SaveChangesAsync();

        await _handler.Handle(MakeCommand(applicationId, parentCnic: "12345-1234567-1"), default);

        // Still only 1 parent — no duplicate created
        _db.Parents.Should().HaveCount(1);
    }
}
