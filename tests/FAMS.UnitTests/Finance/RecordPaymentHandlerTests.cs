using FAMS.Application.Common.Interfaces;
using FAMS.Application.Modules.Finance.Fee.Commands.RecordPayment;
using FAMS.Domain.Entities;
using FAMS.Domain.Enums;
using FAMS.Infrastructure.Persistence;
using FAMS.UnitTests.Infrastructure;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace FAMS.UnitTests.Finance;

public class RecordPaymentHandlerTests : IDisposable
{
    private readonly FamsDbContext _db;
    private readonly Mock<IPdfService> _pdf = new();
    private readonly Mock<IEmailService> _email = new();
    private readonly RecordPaymentCommandHandler _handler;

    private static readonly Guid _receivedById = Guid.NewGuid();

    public RecordPaymentHandlerTests()
    {
        _db = TestDbContext.Create();
        _handler = new RecordPaymentCommandHandler(
            _db, _pdf.Object, _email.Object,
            NullLogger<RecordPaymentCommandHandler>.Instance);
    }

    public void Dispose() => _db.Dispose();

    private async Task<FeeInvoice> SeedInvoiceAsync(decimal total = 1000m, decimal discount = 0m)
    {
        var school = School.Create("Falcon College", "FC", "Karachi");
        _db.Schools.Add(school);

        var campus = Campus.Create("Main Campus", "MC", "Karachi", "123 Street",
            "021-000000", "mc@fams.pk", "Mr. Ali", 500);
        campus.AssignSchool(school.Id);
        _db.Campuses.Add(campus);

        var student = Student.Create("Ali", "Khan", "Akbar", new DateTime(2005, 1, 1),
            Gender.Male, "Karachi", "03001234567",
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            "R001", "Father Ali", "03009876543");
        student.CampusId = campus.Id;
        _db.Students.Add(student);

        var invoice = FeeInvoice.Create(student.Id, "INV-001",
            DateTime.UtcNow, DateTime.UtcNow.AddDays(30), total, "Term-1", discount);
        invoice.CampusId = campus.Id;
        _db.FeeInvoices.Add(invoice);

        await _db.SaveChangesAsync();
        return invoice;
    }

    [Fact]
    public async Task Handle_InvoiceNotFound_ThrowsNotFoundException()
    {
        var cmd = new RecordPaymentCommand(Guid.NewGuid(), 100m, "Cash", null, _receivedById);

        var act = () => _handler.Handle(cmd, default);

        await act.Should().ThrowAsync<Exception>().WithMessage("*FeeInvoice*");
    }

    [Fact]
    public async Task Handle_AmountExceedsBalance_ReturnsFailure()
    {
        var invoice = await SeedInvoiceAsync(total: 500m);

        var result = await _handler.Handle(
            new RecordPaymentCommand(invoice.Id, 600m, "Cash", null, _receivedById), default);

        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("exceeds");
    }

    [Fact]
    public async Task Handle_ValidPartialPayment_CreatesPaymentAndReturnsId()
    {
        var invoice = await SeedInvoiceAsync(total: 1000m);

        var result = await _handler.Handle(
            new RecordPaymentCommand(invoice.Id, 400m, "Cash", null, _receivedById), default);

        result.IsSuccess.Should().BeTrue();
        _db.FeePayments.Should().HaveCount(1);
        _db.FeePayments.First().Amount.Should().Be(400m);
    }

    [Fact]
    public async Task Handle_FullPayment_SetsInvoiceStatusPaid()
    {
        var invoice = await SeedInvoiceAsync(total: 1000m);

        await _handler.Handle(
            new RecordPaymentCommand(invoice.Id, 1000m, "Online", "TXN-001", _receivedById), default);

        var updated = await _db.FeeInvoices.FindAsync(invoice.Id);
        updated!.Status.Should().Be(PaymentStatus.Paid);
        updated.Balance.Should().Be(0m);
    }

    [Fact]
    public async Task Handle_PaymentWithDiscount_CorrectBalance()
    {
        // Net = 1000 - 200 = 800
        var invoice = await SeedInvoiceAsync(total: 1000m, discount: 200m);

        var result = await _handler.Handle(
            new RecordPaymentCommand(invoice.Id, 800m, "Cash", null, _receivedById), default);

        result.IsSuccess.Should().BeTrue();
        var updated = await _db.FeeInvoices.FindAsync(invoice.Id);
        updated!.Status.Should().Be(PaymentStatus.Paid);
    }

    [Fact]
    public async Task Handle_Receipt_NumberContainsCampusCode()
    {
        var invoice = await SeedInvoiceAsync();

        await _handler.Handle(
            new RecordPaymentCommand(invoice.Id, 200m, "Cash", null, _receivedById), default);

        var payment = _db.FeePayments.First();
        payment.ReceiptNumber.Should().StartWith("REC-MC-");
    }
}
