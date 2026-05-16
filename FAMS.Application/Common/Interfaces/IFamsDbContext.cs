using FAMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using AppEntity = FAMS.Domain.Entities.Application;

namespace FAMS.Application.Common.Interfaces;

public interface IFamsDbContext
{
    DbSet<School> Schools { get; }
    DbSet<Campus> Campuses { get; }
    DbSet<Student> Students { get; }
    DbSet<Parent> Parents { get; }
    DbSet<Staff> StaffMembers { get; }
    DbSet<AcademicProgram> Programs { get; }
    DbSet<ClassRoom> ClassRooms { get; }
    DbSet<Section> Sections { get; }
    DbSet<Subject> Subjects { get; }
    DbSet<Attendance> Attendances { get; }
    DbSet<FeeInvoice> FeeInvoices { get; }
    DbSet<FeePayment> FeePayments { get; }
    DbSet<Result> Results { get; }
    DbSet<Leave> Leaves { get; }
    DbSet<Payroll> Payrolls { get; }
    DbSet<TimetableSlot> TimetableSlots { get; }
    DbSet<Exam> Exams { get; }
    DbSet<ExamScheduleItem> ExamScheduleItems { get; }
    DbSet<PurchaseRequisition> PurchaseRequisitions { get; }
    DbSet<RequisitionLineItem> RequisitionLineItems { get; }
    DbSet<GoodsReceipt> GoodsReceipts { get; }
    DbSet<GoodsReceiptLineItem> GoodsReceiptLineItems { get; }
    DbSet<Asset> Assets { get; }
    DbSet<Vendor> Vendors { get; }
    DbSet<PurchaseOrder> PurchaseOrders { get; }
    DbSet<POLineItem> POLineItems { get; }
    DbSet<AuditLog> AuditLogs { get; }
    DbSet<AppEntity> Applications { get; }

    // Sprint-C entities — newly wired
    DbSet<Inquiry> Inquiries { get; }
    DbSet<Communication> Communications { get; }
    DbSet<StudentDocument> StudentDocuments { get; }
    DbSet<FeeStructure> FeeStructures { get; }
    DbSet<FeeStructureHead> FeeStructureHeads { get; }
    DbSet<FeeConcession> FeeConcessions { get; }
    DbSet<FeeRefund> FeeRefunds { get; }
    DbSet<Appraisal> Appraisals { get; }
    DbSet<GradingScale> GradingScales { get; }
    DbSet<GradingScaleRule> GradingScaleRules { get; }
    DbSet<EmploymentContract> EmploymentContracts { get; }
    DbSet<Holiday> Holidays { get; }
    DbSet<AcademicTerm> AcademicTerms { get; }
    DbSet<StudentLeave> StudentLeaves { get; }
    DbSet<InventoryItem> InventoryItems { get; }
    DbSet<StockTransaction> StockTransactions { get; }
    DbSet<AssetMaintenanceEvent> AssetMaintenanceEvents { get; }
    DbSet<AssetDepreciation> AssetDepreciations { get; }
    DbSet<AssetAllocation> AssetAllocations { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
