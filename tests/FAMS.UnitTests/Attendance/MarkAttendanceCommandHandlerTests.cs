using FAMS.Application.Common.Notifications.Events;
using FAMS.Application.Modules.Academic.Attendance.Commands.MarkAttendance;
using FAMS.Domain.Entities;
using FAMS.Domain.Enums;
using FAMS.UnitTests.Infrastructure;
using MediatR;
using Moq;
using AttendanceEntity = FAMS.Domain.Entities.Attendance;

namespace FAMS.UnitTests.Attendance;

public class MarkAttendanceCommandHandlerTests : IDisposable
{
    private readonly FAMS.Infrastructure.Persistence.FamsDbContext _db;
    private readonly Mock<IPublisher> _publisher = new();
    private readonly MarkAttendanceCommandHandler _handler;

    private readonly Guid _sectionId  = Guid.NewGuid();
    private readonly Guid _markedById = Guid.NewGuid();

    public MarkAttendanceCommandHandlerTests()
    {
        _db = TestDbContext.Create();
        _handler = new MarkAttendanceCommandHandler(_db, _publisher.Object);
    }

    public void Dispose() => _db.Dispose();

    // ── helpers ───────────────────────────────────────────────────────────────

    private async Task<Guid> SeedStudentAsync(Guid? sectionId = null)
    {
        var student = Student.Create("Ali", "Khan", "Father",
            new DateTime(2005, 1, 1), Gender.Male,
            "Karachi", "03001234567",
            Guid.NewGuid(), Guid.NewGuid(), sectionId ?? _sectionId,
            "R001", "Emergency", "03009876543");
        _db.Students.Add(student);
        await _db.SaveChangesAsync();
        return student.Id;
    }

    private MarkAttendanceCommand MakeCommand(Guid studentId, bool isPresent = true,
        bool isLeave = false, bool isOffline = false, DateTime? date = null)
        => new(_sectionId, date ?? DateTime.UtcNow, _markedById,
               [new AttendanceEntry(studentId, isPresent, false, isLeave)],
               isOffline);

    // ── section validation ────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_StudentNotInSection_ReturnsFailure()
    {
        var differentSectionId = Guid.NewGuid();
        var studentId = await SeedStudentAsync(sectionId: differentSectionId);

        var result = await _handler.Handle(MakeCommand(studentId), default);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("do not belong to section");
    }

    // ── duplicate prevention ──────────────────────────────────────────────────

    [Fact]
    public async Task Handle_AlreadyMarked_ReturnsZeroWithoutInsertingDuplicate()
    {
        var today = DateTime.UtcNow.Date;
        var studentId = await SeedStudentAsync();

        _db.Attendances.Add(AttendanceEntity.CreateForStudent(studentId, today, true, false, _markedById));
        await _db.SaveChangesAsync();

        var result = await _handler.Handle(MakeCommand(studentId, date: today), default);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().Be(0);
        _db.Attendances.Count().Should().Be(1); // no duplicate inserted
    }

    // ── happy path ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_FreshEntry_CreatesRecordAndReturnsCount()
    {
        var studentId = await SeedStudentAsync();

        var result = await _handler.Handle(MakeCommand(studentId), default);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().Be(1);
        _db.Attendances.Count().Should().Be(1);
    }

    // ── offline sync: no notifications ───────────────────────────────────────

    [Fact]
    public async Task Handle_OfflineAbsentEntry_DoesNotPublishAbsenceNotification()
    {
        var studentId = await SeedStudentAsync();

        await _handler.Handle(MakeCommand(studentId, isPresent: false, isOffline: true), default);

        _publisher.Verify(
            x => x.Publish(It.IsAny<StudentMarkedAbsentEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    // ── online absent: notification published ────────────────────────────────

    [Fact]
    public async Task Handle_OnlineAbsentEntry_PublishesAbsenceNotification()
    {
        var studentId = await SeedStudentAsync();

        await _handler.Handle(MakeCommand(studentId, isPresent: false, isOffline: false), default);

        _publisher.Verify(
            x => x.Publish(It.IsAny<StudentMarkedAbsentEvent>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    // ── leave does NOT trigger absence notification ───────────────────────────

    [Fact]
    public async Task Handle_ApprovedLeaveEntry_DoesNotPublishAbsenceNotification()
    {
        var studentId = await SeedStudentAsync();

        // isPresent=false but isLeave=true → absent on leave, not unexcused absence
        await _handler.Handle(MakeCommand(studentId, isPresent: false, isLeave: true, isOffline: false), default);

        _publisher.Verify(
            x => x.Publish(It.IsAny<StudentMarkedAbsentEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
