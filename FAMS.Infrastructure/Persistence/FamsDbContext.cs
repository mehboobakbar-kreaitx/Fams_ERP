using FAMS.Application.Common.Interfaces;
using FAMS.Domain.Common;
using FAMS.Domain.Entities;
using FAMS.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using AppEntity = FAMS.Domain.Entities.Application;

namespace FAMS.Infrastructure.Persistence;

public class FamsDbContext : IdentityDbContext<ApplicationUser>, IFamsDbContext
{
    private readonly ICurrentUserService _currentUser;

    public FamsDbContext(DbContextOptions<FamsDbContext> options, ICurrentUserService currentUser)
        : base(options)
    {
        _currentUser = currentUser;
    }

    public DbSet<School> Schools => Set<School>();
    public DbSet<Campus> Campuses => Set<Campus>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<Student> Students => Set<Student>();
    public DbSet<Parent> Parents => Set<Parent>();
    public DbSet<Staff> StaffMembers => Set<Staff>();
    public DbSet<AcademicProgram> Programs => Set<AcademicProgram>();
    public DbSet<ClassRoom> ClassRooms => Set<ClassRoom>();
    public DbSet<Section> Sections => Set<Section>();
    public DbSet<Subject> Subjects => Set<Subject>();
    public DbSet<Attendance> Attendances => Set<Attendance>();
    public DbSet<FeeInvoice> FeeInvoices => Set<FeeInvoice>();
    public DbSet<FeePayment> FeePayments => Set<FeePayment>();
    public DbSet<Result> Results => Set<Result>();
    public DbSet<Leave> Leaves => Set<Leave>();
    public DbSet<Payroll> Payrolls => Set<Payroll>();
    public DbSet<TimetableSlot> TimetableSlots => Set<TimetableSlot>();
    public DbSet<Exam> Exams => Set<Exam>();
    public DbSet<ExamScheduleItem> ExamScheduleItems => Set<ExamScheduleItem>();
    public DbSet<PurchaseRequisition> PurchaseRequisitions => Set<PurchaseRequisition>();
    public DbSet<RequisitionLineItem> RequisitionLineItems => Set<RequisitionLineItem>();
    public DbSet<GoodsReceipt> GoodsReceipts => Set<GoodsReceipt>();
    public DbSet<GoodsReceiptLineItem> GoodsReceiptLineItems => Set<GoodsReceiptLineItem>();
    public DbSet<Asset> Assets => Set<Asset>();
    public DbSet<Vendor> Vendors => Set<Vendor>();
    public DbSet<PurchaseOrder> PurchaseOrders => Set<PurchaseOrder>();
    public DbSet<POLineItem> POLineItems => Set<POLineItem>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<AppEntity> Applications => Set<AppEntity>();

    // Sprint-C — orphan entities wired
    public DbSet<Inquiry> Inquiries => Set<Inquiry>();
    public DbSet<Communication> Communications => Set<Communication>();
    public DbSet<StudentDocument> StudentDocuments => Set<StudentDocument>();
    public DbSet<FeeStructure> FeeStructures => Set<FeeStructure>();
    public DbSet<FeeStructureHead> FeeStructureHeads => Set<FeeStructureHead>();
    public DbSet<FeeConcession> FeeConcessions => Set<FeeConcession>();
    public DbSet<FeeRefund> FeeRefunds => Set<FeeRefund>();
    public DbSet<Appraisal> Appraisals => Set<Appraisal>();
    public DbSet<GradingScale> GradingScales => Set<GradingScale>();
    public DbSet<GradingScaleRule> GradingScaleRules => Set<GradingScaleRule>();
    public DbSet<EmploymentContract> EmploymentContracts => Set<EmploymentContract>();
    public DbSet<Holiday> Holidays => Set<Holiday>();
    public DbSet<AcademicTerm> AcademicTerms => Set<AcademicTerm>();
    public DbSet<StudentLeave> StudentLeaves => Set<StudentLeave>();
    public DbSet<InventoryItem> InventoryItems => Set<InventoryItem>();
    public DbSet<StockTransaction> StockTransactions => Set<StockTransaction>();
    public DbSet<AssetMaintenanceEvent> AssetMaintenanceEvents => Set<AssetMaintenanceEvent>();
    public DbSet<AssetDepreciation> AssetDepreciations => Set<AssetDepreciation>();
    public DbSet<AssetAllocation> AssetAllocations => Set<AssetAllocation>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(FamsDbContext).Assembly);

        builder.Entity<School>(e =>
        {
            e.HasKey(s => s.Id);
            e.Property(s => s.Name).IsRequired().HasMaxLength(200);
            e.Property(s => s.Code).IsRequired().HasMaxLength(20);
            e.HasIndex(s => s.Code).IsUnique();
            e.HasMany(s => s.Campuses)
             .WithOne(c => c.School)
             .HasForeignKey(c => c.SchoolId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        ApplySoftDeleteFilter(builder);

        // Campus filter overwrites the soft-delete-only filter from the loop above,
        // adding school-level scoping on top. SuperAdmin (SchoolId == null) sees all campuses.
        builder.Entity<Campus>().HasQueryFilter(c =>
            !c.IsDeleted &&
            (_currentUser.SchoolId == null || c.SchoolId == _currentUser.SchoolId));
    }

    private static void ApplySoftDeleteFilter(ModelBuilder builder)
    {
        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            if (typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
            {
                var parameter = System.Linq.Expressions.Expression.Parameter(entityType.ClrType, "e");
                var prop = System.Linq.Expressions.Expression.Property(parameter, nameof(BaseEntity.IsDeleted));
                var falseConst = System.Linq.Expressions.Expression.Constant(false);
                var body = System.Linq.Expressions.Expression.Equal(prop, falseConst);
                var lambda = System.Linq.Expressions.Expression.Lambda(body, parameter);
                builder.Entity(entityType.ClrType).HasQueryFilter(lambda);
            }
        }
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var userId = _currentUser.UserId ?? "system";
        var userName = _currentUser.UserName ?? "system";
        var campusId = _currentUser.CampusId ?? Guid.Empty;

        var auditEntries = new List<(EntityEntry Entry, string Action, string? OldJson)>();

        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = now;
                    entry.Entity.UpdatedAt = now;
                    entry.Entity.CreatedBy = userId;
                    entry.Entity.UpdatedBy = userId;
                    if (entry.Entity.CampusId == Guid.Empty && campusId != Guid.Empty)
                        entry.Entity.CampusId = campusId;
                    if (entry.Entity is not AuditLog)
                        auditEntries.Add((entry, "Create", null));
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = now;
                    entry.Entity.UpdatedBy = userId;
                    if (entry.Entity is not AuditLog)
                        auditEntries.Add((entry, entry.Entity.IsDeleted ? "Delete" : "Update", SerializeOriginal(entry)));
                    break;
                case EntityState.Deleted:
                    if (entry.Entity is not AuditLog)
                        auditEntries.Add((entry, "HardDelete", SerializeOriginal(entry)));
                    break;
            }
        }

        var result = await base.SaveChangesAsync(cancellationToken);

        if (auditEntries.Count > 0)
        {
            foreach (var (entry, action, oldJson) in auditEntries)
            {
                var name = entry.Entity.GetType().Name;
                var id = entry.Property("Id").CurrentValue?.ToString() ?? string.Empty;
                var newJson = SerializeCurrent(entry);
                AuditLogs.Add(AuditLog.Create(name, id, action, userId, userName, oldJson, newJson));
            }
            await base.SaveChangesAsync(cancellationToken);
        }

        return result;
    }

    private static string? SerializeOriginal(EntityEntry entry) =>
        System.Text.Json.JsonSerializer.Serialize(
            entry.Properties.Where(p => p.IsModified || entry.State == EntityState.Deleted)
                            .ToDictionary(p => p.Metadata.Name, p => (object?)p.OriginalValue));

    private static string SerializeCurrent(EntityEntry entry) =>
        System.Text.Json.JsonSerializer.Serialize(
            entry.Properties.ToDictionary(p => p.Metadata.Name, p => (object?)p.CurrentValue));
}
