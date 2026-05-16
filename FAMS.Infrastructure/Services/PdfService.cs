using FAMS.Application.Common.Interfaces;
using FAMS.Application.Common.Exceptions;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace FAMS.Infrastructure.Services;

public class PdfService : IPdfService
{
    private readonly IFamsDbContext _db;

    static PdfService() => QuestPDF.Settings.License = LicenseType.Community;

    public PdfService(IFamsDbContext db)
    {
        _db = db;
    }

    // ------------- Grade Card -------------
    public async Task<byte[]> GenerateGradeCardAsync(Guid studentId, string termName, CancellationToken ct = default)
    {
        var student = await _db.Students.AsNoTracking()
            .Where(s => s.Id == studentId)
            .Select(s => new { s.Id, s.FirstName, s.LastName, s.RollNumber, s.CampusId, s.ClassId, s.SectionId, s.FatherName })
            .FirstOrDefaultAsync(ct)
            ?? throw new NotFoundException("Student", studentId);

        var campus = await _db.Campuses.AsNoTracking().Where(c => c.Id == student.CampusId).Select(c => c.Name).FirstOrDefaultAsync(ct);
        var className = await _db.ClassRooms.AsNoTracking().Where(c => c.Id == student.ClassId).Select(c => c.Name).FirstOrDefaultAsync(ct);
        var sectionName = await _db.Sections.AsNoTracking().Where(c => c.Id == student.SectionId).Select(c => c.Name).FirstOrDefaultAsync(ct);

        var results = await _db.Results.AsNoTracking()
            .Where(r => r.StudentId == studentId && r.TermName == termName && r.IsPublished)
            .Join(_db.Subjects.AsNoTracking(), r => r.SubjectId, s => s.Id, (r, s) => new
            {
                Subject = s.Name,
                Exam = r.ExamType,
                Obtained = r.MarksObtained,
                Total = r.TotalMarks,
                Grade = r.Grade
            })
            .ToListAsync(ct);

        var totalObtained = results.Sum(r => r.Obtained);
        var totalMax = results.Sum(r => r.Total);
        var pct = totalMax > 0 ? Math.Round(totalObtained / totalMax * 100m, 2) : 0;

        return Document.Create(c =>
        {
            c.Page(p =>
            {
                p.Margin(40);
                p.Size(PageSizes.A4);
                p.DefaultTextStyle(t => t.FontSize(10));

                p.Header().Element(h => Header(h, campus ?? "Falcon College", "GRADE CARD"));

                p.Content().Column(col =>
                {
                    col.Spacing(10);

                    col.Item().Row(r =>
                    {
                        r.RelativeItem().Column(c2 =>
                        {
                            c2.Item().Text($"Name: {student.FirstName} {student.LastName}").SemiBold();
                            c2.Item().Text($"Father: {student.FatherName}");
                            c2.Item().Text($"Roll #: {student.RollNumber}");
                        });
                        r.RelativeItem().Column(c2 =>
                        {
                            c2.Item().Text($"Class: {className ?? "-"}");
                            c2.Item().Text($"Section: {sectionName ?? "-"}");
                            c2.Item().Text($"Term: {termName}").SemiBold();
                        });
                    });

                    col.Item().PaddingTop(8).Table(t =>
                    {
                        t.ColumnsDefinition(d =>
                        {
                            d.RelativeColumn(3);
                            d.RelativeColumn(2);
                            d.RelativeColumn(1.2f);
                            d.RelativeColumn(1.2f);
                            d.RelativeColumn(1f);
                        });
                        t.Header(h =>
                        {
                            foreach (var col2 in new[] { "Subject", "Exam", "Obtained", "Total", "Grade" })
                                h.Cell().BorderBottom(1).PaddingVertical(4).Text(col2).SemiBold();
                        });
                        foreach (var r in results)
                        {
                            t.Cell().PaddingVertical(3).Text(r.Subject);
                            t.Cell().PaddingVertical(3).Text(r.Exam);
                            t.Cell().PaddingVertical(3).Text(r.Obtained.ToString("0.##"));
                            t.Cell().PaddingVertical(3).Text(r.Total.ToString("0.##"));
                            t.Cell().PaddingVertical(3).Text(r.Grade);
                        }
                        if (results.Count == 0)
                        {
                            t.Cell().ColumnSpan(5).PaddingVertical(8).AlignCenter()
                                .Text("No published results for this term.").Italic();
                        }
                    });

                    col.Item().PaddingTop(10).BorderTop(1).PaddingTop(8).Row(r =>
                    {
                        r.RelativeItem().Text($"Total Obtained: {totalObtained:0.##} / {totalMax:0.##}").SemiBold();
                        r.RelativeItem().AlignRight().Text($"Percentage: {pct}%").SemiBold();
                    });
                });

                p.Footer().Element(Footer);
            });
        }).GeneratePdf();
    }

    // ------------- Payslip -------------
    public async Task<byte[]> GeneratePayslipAsync(Guid staffId, int month, int year, CancellationToken ct = default)
    {
        var payroll = await _db.Payrolls.AsNoTracking()
            .Where(p => p.StaffId == staffId && p.Month == month && p.Year == year)
            .FirstOrDefaultAsync(ct)
            ?? throw new NotFoundException($"No payroll record for staff {staffId} in {month:D2}/{year}.");

        var staff = await _db.StaffMembers.AsNoTracking()
            .Where(s => s.Id == staffId)
            .Select(s => new { s.FirstName, s.LastName, s.Designation, s.Department, s.CNIC, s.CampusId })
            .FirstOrDefaultAsync(ct)
            ?? throw new NotFoundException("Staff", staffId);

        var campus = await _db.Campuses.AsNoTracking().Where(c => c.Id == staff.CampusId).Select(c => c.Name).FirstOrDefaultAsync(ct);

        return Document.Create(c =>
        {
            c.Page(p =>
            {
                p.Margin(40);
                p.Size(PageSizes.A4);
                p.DefaultTextStyle(t => t.FontSize(10));

                p.Header().Element(h => Header(h, campus ?? "Falcon College", $"PAYSLIP — {month:D2}/{year}"));

                p.Content().Column(col =>
                {
                    col.Spacing(10);

                    col.Item().Row(r =>
                    {
                        r.RelativeItem().Column(c2 =>
                        {
                            c2.Item().Text($"Name: {staff.FirstName} {staff.LastName}").SemiBold();
                            c2.Item().Text($"CNIC: {staff.CNIC}");
                            c2.Item().Text($"Designation: {staff.Designation}");
                        });
                        r.RelativeItem().Column(c2 =>
                        {
                            c2.Item().Text($"Department: {staff.Department}");
                            c2.Item().Text($"Period: {month:D2}/{year}");
                            c2.Item().Text($"Status: {payroll.Status}");
                        });
                    });

                    col.Item().PaddingTop(8).Table(t =>
                    {
                        t.ColumnsDefinition(d => { d.RelativeColumn(3); d.RelativeColumn(1.5f); });
                        AmountRow(t, "Basic Salary",        payroll.BasicSalary);
                        AmountRow(t, "Allowances",          payroll.Allowances);
                        AmountRow(t, "Gross Salary",        payroll.GrossSalary, bold: true);
                        AmountRow(t, "Income Tax",          -payroll.IncomeTax);
                        AmountRow(t, "EOBI Contribution",   -payroll.EobiContribution);
                        AmountRow(t, "Other Deductions",    -payroll.Deductions);
                        AmountRow(t, "Net Salary",          payroll.NetSalary, bold: true);
                    });

                    if (!string.IsNullOrWhiteSpace(payroll.Remarks))
                        col.Item().PaddingTop(8).Text($"Remarks: {payroll.Remarks}").Italic();
                });

                p.Footer().Element(Footer);
            });
        }).GeneratePdf();
    }

    // ------------- Fee Receipt -------------
    public async Task<byte[]> GenerateFeeReceiptAsync(Guid paymentId, CancellationToken ct = default)
    {
        var pay = await _db.FeePayments.AsNoTracking()
            .Where(p => p.Id == paymentId)
            .Select(p => new
            {
                p.Id, p.Amount, p.PaymentDate, p.PaymentMethod, p.TransactionId, p.ReceiptNumber,
                p.InvoiceId
            })
            .FirstOrDefaultAsync(ct)
            ?? throw new NotFoundException("FeePayment", paymentId);

        var inv = await _db.FeeInvoices.AsNoTracking()
            .Where(i => i.Id == pay.InvoiceId)
            .Select(i => new { i.InvoiceNumber, i.StudentId, i.TermName, i.TotalAmount, i.PaidAmount, i.LateFee, i.Discount, i.DueDate, i.Status, i.CampusId })
            .FirstOrDefaultAsync(ct)
            ?? throw new NotFoundException("FeeInvoice", pay.InvoiceId);

        var student = await _db.Students.AsNoTracking()
            .Where(s => s.Id == inv.StudentId)
            .Select(s => new { s.FirstName, s.LastName, s.RollNumber, s.FatherName })
            .FirstOrDefaultAsync(ct);

        var campus = await _db.Campuses.AsNoTracking().Where(c => c.Id == inv.CampusId).Select(c => c.Name).FirstOrDefaultAsync(ct);

        var outstanding = inv.TotalAmount + inv.LateFee - inv.Discount - inv.PaidAmount;

        return Document.Create(c =>
        {
            c.Page(p =>
            {
                p.Margin(40);
                p.Size(PageSizes.A4);
                p.DefaultTextStyle(t => t.FontSize(10));

                p.Header().Element(h => Header(h, campus ?? "Falcon College", $"FEE RECEIPT — {pay.ReceiptNumber}"));

                p.Content().Column(col =>
                {
                    col.Spacing(10);

                    col.Item().Row(r =>
                    {
                        r.RelativeItem().Column(c2 =>
                        {
                            c2.Item().Text($"Student: {student?.FirstName} {student?.LastName}").SemiBold();
                            c2.Item().Text($"Father: {student?.FatherName ?? "-"}");
                            c2.Item().Text($"Roll #: {student?.RollNumber ?? "-"}");
                        });
                        r.RelativeItem().Column(c2 =>
                        {
                            c2.Item().Text($"Invoice #: {inv.InvoiceNumber}");
                            c2.Item().Text($"Term: {inv.TermName}");
                            c2.Item().Text($"Paid On: {pay.PaymentDate:yyyy-MM-dd}");
                        });
                    });

                    col.Item().PaddingTop(8).Table(t =>
                    {
                        t.ColumnsDefinition(d => { d.RelativeColumn(3); d.RelativeColumn(1.5f); });
                        AmountRow(t, "Total Amount Billed",  inv.TotalAmount);
                        AmountRow(t, "Late Fee",             inv.LateFee);
                        AmountRow(t, "Discount",             -inv.Discount);
                        AmountRow(t, "Amount Paid (This Receipt)", pay.Amount, bold: true);
                        AmountRow(t, "Total Paid to Date",   inv.PaidAmount);
                        AmountRow(t, "Outstanding Balance",  outstanding, bold: true);
                    });

                    col.Item().PaddingTop(8).Column(c2 =>
                    {
                        c2.Item().Text($"Payment Method: {pay.PaymentMethod}");
                        if (!string.IsNullOrWhiteSpace(pay.TransactionId))
                            c2.Item().Text($"Transaction ID: {pay.TransactionId}");
                    });
                });

                p.Footer().Element(Footer);
            });
        }).GeneratePdf();
    }

    // ------------- Offer Letter -------------
    public async Task<byte[]> GenerateOfferLetterAsync(Guid applicationId, CancellationToken ct = default)
    {
        var app = await _db.Applications.AsNoTracking()
            .Where(a => a.Id == applicationId)
            .Select(a => new { a.FirstName, a.LastName, a.FatherName, a.ProgramId, a.CampusId, a.Status, a.TestMarks })
            .FirstOrDefaultAsync(ct)
            ?? throw new NotFoundException("Application", applicationId);

        var program = await _db.Programs.AsNoTracking().Where(p => p.Id == app.ProgramId).Select(p => p.Name).FirstOrDefaultAsync(ct);
        var campus = await _db.Campuses.AsNoTracking().Where(c => c.Id == app.CampusId).Select(c => c.Name).FirstOrDefaultAsync(ct);

        return Document.Create(c =>
        {
            c.Page(p =>
            {
                p.Margin(40);
                p.Size(PageSizes.A4);
                p.DefaultTextStyle(t => t.FontSize(11));

                p.Header().Element(h => Header(h, campus ?? "Falcon College", "ADMISSION OFFER LETTER"));

                p.Content().Column(col =>
                {
                    col.Spacing(12);
                    col.Item().Text($"Dear {app.FirstName} {app.LastName},").SemiBold();
                    col.Item().Text($"S/o {app.FatherName}");
                    col.Item().PaddingTop(4).Text(
                        $"On behalf of {campus ?? "Falcon College"}, we are pleased to offer you provisional admission " +
                        $"to the {program ?? "selected"} program based on your application and test performance " +
                        $"({app.TestMarks:0.##} marks). To confirm your seat, please deposit the first-term fee within 14 days.");

                    col.Item().PaddingTop(10).Text("Next steps:").SemiBold();
                    col.Item().Text("• Visit the admissions office with original documents for verification.");
                    col.Item().Text("• Pay the first-term invoice via online banking, JazzCash, or at the cashier.");
                    col.Item().Text("• Once payment is confirmed, your student portal credentials will be activated.");

                    col.Item().PaddingTop(20).Text("We look forward to welcoming you.");
                    col.Item().PaddingTop(20).Text("Sincerely,");
                    col.Item().Text("Principal / Admissions Office").Italic();
                });

                p.Footer().Element(Footer);
            });
        }).GeneratePdf();
    }

    // ------------- Admit Card -------------
    public async Task<byte[]> GenerateAdmitCardAsync(Guid studentId, Guid examScheduleId, CancellationToken ct = default)
    {
        var student = await _db.Students.AsNoTracking()
            .Where(s => s.Id == studentId)
            .Select(s => new { s.FirstName, s.LastName, s.RollNumber, s.CampusId })
            .FirstOrDefaultAsync(ct)
            ?? throw new NotFoundException("Student", studentId);

        var schedule = await _db.ExamScheduleItems.AsNoTracking()
            .Where(e => e.Id == examScheduleId)
            .Select(e => new { e.ExamDate, e.StartTime, e.EndTime, e.Hall, e.SubjectId, e.ExamId })
            .FirstOrDefaultAsync(ct)
            ?? throw new NotFoundException("ExamScheduleItem", examScheduleId);

        var subject = await _db.Subjects.AsNoTracking().Where(s => s.Id == schedule.SubjectId).Select(s => s.Name).FirstOrDefaultAsync(ct);
        var exam = await _db.Exams.AsNoTracking().Where(e => e.Id == schedule.ExamId).Select(e => new { e.Name, e.TermName }).FirstOrDefaultAsync(ct);
        var campus = await _db.Campuses.AsNoTracking().Where(c => c.Id == student.CampusId).Select(c => c.Name).FirstOrDefaultAsync(ct);

        return Document.Create(c =>
        {
            c.Page(p =>
            {
                p.Margin(40);
                p.Size(PageSizes.A4);
                p.DefaultTextStyle(t => t.FontSize(11));

                p.Header().Element(h => Header(h, campus ?? "Falcon College", "ADMIT CARD"));

                p.Content().Column(col =>
                {
                    col.Spacing(10);
                    col.Item().Text($"Name: {student.FirstName} {student.LastName}").SemiBold();
                    col.Item().Text($"Roll #: {student.RollNumber}");
                    col.Item().PaddingTop(6).Text($"Exam: {exam?.Name ?? "-"}").SemiBold();
                    col.Item().Text($"Term: {exam?.TermName ?? "-"}");
                    col.Item().Text($"Subject: {subject ?? "-"}");
                    col.Item().Text($"Date: {schedule.ExamDate:yyyy-MM-dd}");
                    col.Item().Text($"Time: {schedule.StartTime:HH\\:mm} – {schedule.EndTime:HH\\:mm}");
                    col.Item().Text($"Hall: {schedule.Hall ?? "-"}");
                    col.Item().PaddingTop(15).Text("Bring this card and a valid photo ID. No mobile phones inside the hall.").Italic();
                });

                p.Footer().Element(Footer);
            });
        }).GeneratePdf();
    }

    // ------------- shared chrome -------------
    private static void Header(IContainer container, string campusName, string title)
    {
        container.BorderBottom(1).PaddingBottom(8).Row(r =>
        {
            r.RelativeItem().Column(c =>
            {
                c.Item().Text("FAMS").FontSize(18).Bold();
                c.Item().Text(campusName).FontSize(10);
            });
            r.RelativeItem().AlignRight().Column(c =>
            {
                c.Item().Text(title).FontSize(14).SemiBold();
                c.Item().Text($"Issued: {DateTime.UtcNow:yyyy-MM-dd}").FontSize(9);
            });
        });
    }

    private static void Footer(IContainer container)
    {
        container.AlignCenter().Text($"Falcon Academic Management System — generated {DateTime.UtcNow:u}")
            .FontSize(8).Italic();
    }

    private static void AmountRow(TableDescriptor t, string label, decimal value, bool bold = false)
    {
        var labelCell = t.Cell().PaddingVertical(3).Text(label);
        var valCell = t.Cell().PaddingVertical(3).AlignRight().Text($"PKR {value:N2}");
        if (bold)
        {
            labelCell.SemiBold();
            valCell.SemiBold();
        }
    }
}
