# FAMS — Complete Development Prompts
## All Phases · All Modules · Full Precision

> **How to use:** Copy each prompt exactly as written and paste into Claude Code (CLI) or Claude chat.
> Run them in order — each prompt builds on the previous one.
> Your solution root is the `FAMS/` folder containing `FAMS.slnx`.

---

# ═══════════════════════════════════════════════════════════
# PHASE 0 — SOLUTION STRUCTURE
# ═══════════════════════════════════════════════════════════

## PROMPT 0.1 — Create Solution Structure

```
You are a senior .NET architect. I have a Visual Studio solution called FAMS (Falcon Academic Management System) with only one project so far: FAMS.API (ASP.NET Core 8 Web API).

My solution root folder contains:
- FAMS.slnx
- FAMS.API/ (existing project)

Do the following IN ORDER:

1. Create these folder structures inside the solution root:
   - src/FAMS.API/ (move is not needed, just note the API is already here)
   - docs/
   - tests/
   - infra/
   - infra/postgres/
   - infra/prometheus/
   - infra/grafana/
   - infra/grafana/dashboards/
   - infra/grafana/provisioning/
   - .github/
   - .github/workflows/
   - .vscode/

2. Create these new C# projects using dotnet CLI commands (give me the exact commands to run in terminal from the solution root):
   - Class Library: FAMS.Domain (target: net8.0)
   - Class Library: FAMS.Application (target: net8.0)
   - Class Library: FAMS.Infrastructure (target: net8.0)
   - xUnit Test Project: FAMS.UnitTests (target: net8.0)
   - xUnit Test Project: FAMS.IntegrationTests (target: net8.0)

3. Set up project references (give exact dotnet CLI commands):
   - FAMS.Domain → no dependencies
   - FAMS.Application → references FAMS.Domain
   - FAMS.Infrastructure → references FAMS.Application + FAMS.Domain
   - FAMS.API → references FAMS.Application + FAMS.Infrastructure
   - FAMS.UnitTests → references FAMS.Application + FAMS.Domain
   - FAMS.IntegrationTests → references FAMS.API + FAMS.Infrastructure

4. Add all projects to the solution (give exact dotnet sln commands)

5. Generate the .gitignore file appropriate for a .NET 8 + React + Docker project

Output: Give me every terminal command to run, in exact order, with no placeholders.
```

---

## PROMPT 0.2 — Install All NuGet Packages

```
I have a FAMS solution with these projects:
- FAMS.API (ASP.NET Core 8 Web API)
- FAMS.Application (Class Library)
- FAMS.Domain (Class Library)
- FAMS.Infrastructure (Class Library)
- FAMS.UnitTests (xUnit)
- FAMS.IntegrationTests (xUnit)

Give me the exact dotnet CLI commands to install ALL required NuGet packages into the correct projects. Do not skip any package. Use exact stable versions.

FAMS.API packages:
- Microsoft.AspNetCore.Authentication.JwtBearer 8.0.0
- Microsoft.AspNetCore.Identity.EntityFrameworkCore 8.0.0
- Swashbuckle.AspNetCore 6.8.1
- Hangfire.AspNetCore 1.8.14
- Hangfire.PostgreSql 1.20.9
- Serilog.AspNetCore 8.0.3
- Serilog.Sinks.Seq 7.0.1
- Serilog.Sinks.Console 6.0.0
- prometheus-net.AspNetCore 8.2.1
- Microsoft.AspNetCore.SignalR 1.2.0
- QuestPDF 2024.10.1
- Audit.NET 27.1.3
- Audit.EntityFramework.Core 27.1.3
- AutoMapper 13.0.1
- AutoMapper.Extensions.Microsoft.DependencyInjection 12.0.1

FAMS.Application packages:
- MediatR 12.4.1
- FluentValidation 11.10.0
- FluentValidation.DependencyInjectionExtensions 11.10.0
- AutoMapper 13.0.1

FAMS.Infrastructure packages:
- Microsoft.EntityFrameworkCore 8.0.0
- Microsoft.EntityFrameworkCore.Design 8.0.0
- Npgsql.EntityFrameworkCore.PostgreSQL 8.0.0
- Microsoft.AspNetCore.Identity.EntityFrameworkCore 8.0.0
- StackExchange.Redis 2.8.16
- AWSSDK.S3 3.7.400.1
- MailKit 4.7.1
- Twilio 7.3.0
- Polly 8.4.2
- NodaTime 3.2.0
- ClosedXML 0.104.1
- Hangfire.PostgreSql 1.20.9
- Serilog 4.1.0

FAMS.UnitTests packages:
- xunit 2.9.2
- xunit.runner.visualstudio 2.8.2
- Moq 4.20.72
- FluentAssertions 6.12.2
- Microsoft.NET.Test.Sdk 17.11.1
- AutoFixture 4.18.1
- AutoFixture.AutoMoq 4.18.1

FAMS.IntegrationTests packages:
- xunit 2.9.2
- Microsoft.AspNetCore.Mvc.Testing 8.0.0
- Testcontainers.PostgreSql 3.10.0
- Testcontainers.Redis 3.10.0
- FluentAssertions 6.12.2
- Microsoft.NET.Test.Sdk 17.11.1

Output all commands in exact order. No placeholders.
```

---

# ═══════════════════════════════════════════════════════════
# PHASE 1 — DOMAIN LAYER
# ═══════════════════════════════════════════════════════════

## PROMPT 1.1 — Base Domain Entities

```
You are a senior C# .NET 8 developer building the Domain layer for FAMS (Falcon Academic Management System) — an enterprise ERP for a 31-campus college network using Clean Architecture.

Generate the following files inside FAMS.Domain project. Every file must be complete, compilable C# with no TODOs.

FILE 1: src/FAMS.Domain/Common/BaseEntity.cs
- Abstract class BaseEntity
- Properties: Id (Guid, default NewGuid), CampusId (Guid — tenant discriminator for RLS), CreatedAt (DateTime), UpdatedAt (DateTime), CreatedBy (string), UpdatedBy (string), IsDeleted (bool, default false)
- No methods, just properties

FILE 2: src/FAMS.Domain/Common/BaseAuditableEntity.cs
- Inherits BaseEntity
- Adds: DeletedAt (DateTime?), DeletedBy (string?)

FILE 3: src/FAMS.Domain/Common/IDomainEvent.cs
- Empty marker interface for domain events
- Implement INotification from MediatR

FILE 4: src/FAMS.Domain/Enums/StudentStatus.cs
- Enum: Prospect=1, Applicant=2, Enrolled=3, Active=4, Graduated=5, Withdrawn=6, Suspended=7

FILE 5: src/FAMS.Domain/Enums/Gender.cs
- Enum: Male=1, Female=2, Other=3

FILE 6: src/FAMS.Domain/Enums/UserRole.cs
- Enum: SystemAdmin=1, Executive=2, Principal=3, AcademicCoordinator=4, Teacher=5, Accountant=6, HrOfficer=7, Student=8, Parent=9, ProcurementOfficer=10

FILE 7: src/FAMS.Domain/Enums/AssetStatus.cs
- Enum: Active=1, UnderMaintenance=2, Condemned=3, Disposed=4

FILE 8: src/FAMS.Domain/Enums/LeaveType.cs
- Enum: Annual=1, Casual=2, Medical=3, Maternity=4, Paternity=5, Unpaid=6

FILE 9: src/FAMS.Domain/Enums/PaymentStatus.cs
- Enum: Pending=1, Paid=2, PartiallyPaid=3, Overdue=4, Waived=5, Refunded=6

FILE 10: src/FAMS.Domain/Enums/ApplicationStatus.cs
- Enum: Inquiry=1, Applied=2, UnderReview=3, Offered=4, Enrolled=5, Declined=6, Withdrawn=7

Output every file with full namespace, using statements, and complete code. Project namespace root is FAMS.Domain.
```

---

## PROMPT 1.2 — Domain Entities (All Modules)

```
You are a senior C# .NET 8 developer. Generate all domain entities for FAMS. Every entity must:
- Inherit from BaseAuditableEntity (in FAMS.Domain.Common)
- Have all properties with correct C# types
- Include XML summary comments on each property
- Have a private parameterless constructor and a public static Create() factory method
- Use proper C# nullable reference types (string? for nullable strings)
- Namespace: FAMS.Domain.Entities

Generate these files:

FILE 1: src/FAMS.Domain/Entities/Campus.cs
Properties: Name(string), Code(string), City(string), Address(string), Phone(string), Email(string), PrincipalName(string), IsActive(bool), MaxCapacity(int)
Navigation: ICollection<Student>, ICollection<Staff>

FILE 2: src/FAMS.Domain/Entities/Student.cs
Properties: FirstName(string), LastName(string), FatherName(string), DateOfBirth(DateTime), Gender(Gender enum), NIC(string?), BForm(string?), Photo(string?), Address(string), Phone(string), Email(string?), EnrollmentDate(DateTime), Status(StudentStatus enum), ProgramId(Guid), ClassId(Guid), SectionId(Guid), RollNumber(string), EmergencyContactName(string), EmergencyContactPhone(string), MedicalNotes(string?), BloodGroup(string?)
Navigation: Campus, Parent, ICollection<Attendance>, ICollection<FeeInvoice>, ICollection<Result>

FILE 3: src/FAMS.Domain/Entities/Parent.cs
Properties: FirstName(string), LastName(string), CNIC(string), Phone(string), Email(string?), Address(string), Occupation(string?), Relationship(string), PortalAccessEnabled(bool)
Navigation: ICollection<Student>

FILE 4: src/FAMS.Domain/Entities/Staff.cs
Properties: FirstName(string), LastName(string), FatherName(string), CNIC(string), Phone(string), Email(string), DateOfBirth(DateTime), Gender(Gender enum), JoiningDate(DateTime), Designation(string), Department(string), Qualification(string), Photo(string?), BasicSalary(decimal), EmploymentType(string), IsActive(bool)
Navigation: Campus, ICollection<Attendance>, ICollection<Leave>

FILE 5: src/FAMS.Domain/Entities/Program.cs (academic program)
Properties: Name(string), Code(string), DurationYears(int), Description(string?), IsActive(bool)

FILE 6: src/FAMS.Domain/Entities/ClassRoom.cs
Properties: Name(string), Code(string), ProgramId(Guid), Year(int), IsActive(bool)
Navigation: Program, ICollection<Section>

FILE 7: src/FAMS.Domain/Entities/Section.cs
Properties: Name(string), ClassRoomId(Guid), TeacherId(Guid?), MaxStudents(int), IsActive(bool)
Navigation: ClassRoom, Staff, ICollection<Student>

FILE 8: src/FAMS.Domain/Entities/Subject.cs
Properties: Name(string), Code(string), CreditHours(int), ProgramId(Guid), IsElective(bool)

FILE 9: src/FAMS.Domain/Entities/Attendance.cs
Properties: StudentId(Guid?), StaffId(Guid?), Date(DateTime), IsPresent(bool), IsLate(bool), Remarks(string?), MarkedById(Guid), SyncedAt(DateTime?), IsOfflineEntry(bool)

FILE 10: src/FAMS.Domain/Entities/FeeInvoice.cs
Properties: StudentId(Guid), InvoiceNumber(string), IssueDate(DateTime), DueDate(DateTime), TotalAmount(decimal), PaidAmount(decimal), Status(PaymentStatus enum), TermName(string), LateFee(decimal), Discount(decimal)
Navigation: Student, ICollection<FeePayment>

FILE 11: src/FAMS.Domain/Entities/FeePayment.cs
Properties: InvoiceId(Guid), Amount(decimal), PaymentDate(DateTime), PaymentMethod(string), TransactionId(string?), ReceiptNumber(string), ReceivedById(Guid)

FILE 12: src/FAMS.Domain/Entities/Result.cs
Properties: StudentId(Guid), SubjectId(Guid), ExamType(string), MarksObtained(decimal), TotalMarks(decimal), Grade(string?), Remarks(string?), TermName(string), IsPublished(bool), PublishedAt(DateTime?)

FILE 13: src/FAMS.Domain/Entities/Leave.cs
Properties: StaffId(Guid), LeaveType(LeaveType enum), StartDate(DateTime), EndDate(DateTime), TotalDays(int), Reason(string), Status(string), ApprovedById(Guid?), ApprovedAt(DateTime?), Remarks(string?)

FILE 14: src/FAMS.Domain/Entities/Asset.cs
Properties: Name(string), AssetCode(string), Category(string), PurchaseDate(DateTime), PurchasePrice(decimal), CurrentValue(decimal), Status(AssetStatus enum), Location(string), CustodianId(Guid?), SerialNumber(string?), WarrantyExpiry(DateTime?), LastMaintenanceDate(DateTime?)

FILE 15: src/FAMS.Domain/Entities/Vendor.cs
Properties: Name(string), ContactPerson(string), Phone(string), Email(string?), Address(string), NTN(string?), Category(string), PaymentTerms(string), IsApproved(bool), Rating(decimal)

FILE 16: src/FAMS.Domain/Entities/PurchaseOrder.cs
Properties: PONumber(string), VendorId(Guid), OrderDate(DateTime), ExpectedDelivery(DateTime?), TotalAmount(decimal), Status(string), ApprovedById(Guid?), Notes(string?)
Navigation: Vendor, ICollection<POLineItem>

FILE 17: src/FAMS.Domain/Entities/POLineItem.cs
Properties: POId(Guid), Description(string), Quantity(decimal), UnitPrice(decimal), TotalPrice(decimal), Unit(string)

FILE 18: src/FAMS.Domain/Entities/AuditLog.cs
Properties: EntityName(string), EntityId(string), Action(string), OldValues(string?), NewValues(string?), UserId(string), UserName(string), IpAddress(string?), Timestamp(DateTime)
Note: Does NOT inherit BaseAuditableEntity — it IS the audit record itself. Inherit BaseEntity only.

Output every file complete and compilable.
```

---

# ═══════════════════════════════════════════════════════════
# PHASE 2 — APPLICATION LAYER
# ═══════════════════════════════════════════════════════════

## PROMPT 2.1 — Application Layer Setup (Interfaces + Behaviors)

```
You are a senior C# .NET 8 developer building the Application layer for FAMS using Clean Architecture + CQRS with MediatR.

Generate these files for FAMS.Application project:

FILE 1: src/FAMS.Application/Common/Interfaces/IFamsDbContext.cs
- Interface exposing DbSet properties for all 18 domain entities
- Method: Task<int> SaveChangesAsync(CancellationToken cancellationToken)
- Each DbSet as a property, e.g.: DbSet<Student> Students { get; }
- Import Microsoft.EntityFrameworkCore

FILE 2: src/FAMS.Application/Common/Interfaces/ICurrentUserService.cs
- Interface with:
  - string? UserId { get; }
  - string? UserName { get; }
  - Guid? CampusId { get; }
  - string? Role { get; }
  - bool IsAuthenticated { get; }

FILE 3: src/FAMS.Application/Common/Interfaces/IEmailService.cs
- Interface with method:
  - Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default)
  - Task SendBulkAsync(IEnumerable<string> recipients, string subject, string htmlBody, CancellationToken ct = default)

FILE 4: src/FAMS.Application/Common/Interfaces/ISmsService.cs
- Interface with:
  - Task SendAsync(string phoneNumber, string message, CancellationToken ct = default)
  - Task SendBulkAsync(IEnumerable<string> phoneNumbers, string message, CancellationToken ct = default)

FILE 5: src/FAMS.Application/Common/Interfaces/IStorageService.cs
- Interface with:
  - Task<string> UploadAsync(Stream fileStream, string fileName, string bucketName, CancellationToken ct = default)
  - Task<Stream> DownloadAsync(string fileName, string bucketName, CancellationToken ct = default)
  - Task DeleteAsync(string fileName, string bucketName, CancellationToken ct = default)
  - Task<string> GetPresignedUrlAsync(string fileName, string bucketName, int expiryMinutes = 60)

FILE 6: src/FAMS.Application/Common/Interfaces/IPdfService.cs
- Interface with:
  - Task<byte[]> GenerateGradeCardAsync(Guid studentId, string termName, CancellationToken ct = default)
  - Task<byte[]> GeneratePayslipAsync(Guid staffId, int month, int year, CancellationToken ct = default)
  - Task<byte[]> GenerateFeeReceiptAsync(Guid paymentId, CancellationToken ct = default)
  - Task<byte[]> GenerateOfferLetterAsync(Guid applicationId, CancellationToken ct = default)

FILE 7: src/FAMS.Application/Common/Interfaces/IAiChatbotService.cs
- Interface with:
  - Task<string> GetResponseAsync(string userMessage, string userRole, Guid campusId, CancellationToken ct = default)

FILE 8: src/FAMS.Application/Common/Interfaces/IDateTime.cs
- Interface: DateTime Now { get; } and DateTime UtcNow { get; }

FILE 9: src/FAMS.Application/Common/Models/Result.cs
- Generic Result<T> class for CQRS responses:
  - bool IsSuccess
  - T? Value
  - string? Error
  - List<string> ValidationErrors
  - Static factories: Success(T value), Failure(string error), ValidationFailure(List<string> errors)
- Also non-generic Result class with same pattern (no Value)

FILE 10: src/FAMS.Application/Common/Models/PaginatedList.cs
- Generic PaginatedList<T>:
  - List<T> Items
  - int TotalCount
  - int PageNumber
  - int PageSize
  - int TotalPages (computed)
  - bool HasPreviousPage, HasNextPage (computed)
  - Static async factory: CreateAsync(IQueryable<T> source, int pageNumber, int pageSize)

FILE 11: src/FAMS.Application/Common/Behaviors/ValidationBehavior.cs
- MediatR IPipelineBehavior<TRequest, TResponse>
- Runs all FluentValidation validators for the request
- Returns Result with validation errors if any validator fails
- Generic constraint: TResponse must be Result or Result<T>

FILE 12: src/FAMS.Application/Common/Behaviors/LoggingBehavior.cs
- MediatR IPipelineBehavior<TRequest, TResponse>
- Logs request name, execution time using Serilog ILogger
- Logs warning if execution time > 500ms

FILE 13: src/FAMS.Application/Common/Behaviors/AuthorizationBehavior.cs
- MediatR IPipelineBehavior<TRequest, TResponse>
- Check if request has [Authorize] attribute
- Validate user role against required roles
- Throw UnauthorizedAccessException if not authorized

FILE 14: src/FAMS.Application/Common/Exceptions/ValidationException.cs
FILE 15: src/FAMS.Application/Common/Exceptions/NotFoundException.cs
FILE 16: src/FAMS.Application/Common/Exceptions/UnauthorizedException.cs
- Each is a proper custom exception class inheriting from Exception
- Include constructors with message and optional inner exception

Output all files complete and compilable. Namespace root: FAMS.Application
```

---

## PROMPT 2.2 — CRM Module CQRS (Students)

```
You are a senior C# .NET 8 developer. Generate the complete CQRS implementation for the CRM module (Student Management) in FAMS.Application.

Use MediatR for commands/queries. Use FluentValidation for validation. Return Result<T> from FAMS.Application.Common.Models.

Generate these files:

--- QUERIES ---

FILE 1: src/FAMS.Application/Modules/CRM/Queries/GetStudents/GetStudentsQuery.cs
- Record: GetStudentsQuery implements IRequest<Result<PaginatedList<StudentDto>>>
- Properties: int PageNumber=1, int PageSize=20, string? SearchTerm, Guid? ClassId, string? Status, Guid CampusId

FILE 2: src/FAMS.Application/Modules/CRM/Queries/GetStudents/GetStudentsQueryHandler.cs
- Implements IRequestHandler<GetStudentsQuery, Result<PaginatedList<StudentDto>>>
- Queries IFamsDbContext.Students
- Filters by CampusId (always), SearchTerm (FirstName, LastName, RollNumber), ClassId, Status
- Returns paginated list

FILE 3: src/FAMS.Application/Modules/CRM/Queries/GetStudents/StudentDto.cs
- Record with: Id, FirstName, LastName, FatherName, RollNumber, Status, ClassName, SectionName, Phone, Email, Photo, EnrollmentDate

FILE 4: src/FAMS.Application/Modules/CRM/Queries/GetStudentById/GetStudentByIdQuery.cs
- Record: GetStudentByIdQuery(Guid Id) implements IRequest<Result<StudentDetailDto>>

FILE 5: src/FAMS.Application/Modules/CRM/Queries/GetStudentById/GetStudentByIdQueryHandler.cs
- Returns full student detail including parent info, campus, fee status summary

FILE 6: src/FAMS.Application/Modules/CRM/Queries/GetStudentById/StudentDetailDto.cs
- Full detail record with all student fields + ParentName, ParentPhone, CampusName, OutstandingFees(decimal), AttendancePercentage(decimal)

--- COMMANDS ---

FILE 7: src/FAMS.Application/Modules/CRM/Commands/CreateStudent/CreateStudentCommand.cs
- Record implementing IRequest<Result<Guid>>
- All required student fields as properties

FILE 8: src/FAMS.Application/Modules/CRM/Commands/CreateStudent/CreateStudentCommandValidator.cs
- FluentValidation AbstractValidator<CreateStudentCommand>
- Rules: FirstName required max 100, LastName required max 100, DateOfBirth must be in past, Phone must match Pakistani format (03XX-XXXXXXX), Email must be valid if provided, ClassId must not be empty, SectionId must not be empty

FILE 9: src/FAMS.Application/Modules/CRM/Commands/CreateStudent/CreateStudentCommandHandler.cs
- Validates uniqueness of RollNumber within campus
- Creates Student entity using Student.Create() factory
- Saves to database
- Returns student Id

FILE 10: src/FAMS.Application/Modules/CRM/Commands/UpdateStudent/UpdateStudentCommand.cs
FILE 11: src/FAMS.Application/Modules/CRM/Commands/UpdateStudent/UpdateStudentCommandValidator.cs
FILE 12: src/FAMS.Application/Modules/CRM/Commands/UpdateStudent/UpdateStudentCommandHandler.cs
- Update all updatable fields, throw NotFoundException if not found

FILE 13: src/FAMS.Application/Modules/CRM/Commands/UpdateStudentStatus/UpdateStudentStatusCommand.cs
- Record: UpdateStudentStatusCommand(Guid StudentId, StudentStatus NewStatus, string Reason)

FILE 14: src/FAMS.Application/Modules/CRM/Commands/UpdateStudentStatus/UpdateStudentStatusCommandHandler.cs
- Updates student status with timestamp and reason in audit

FILE 15: src/FAMS.Application/Modules/CRM/Commands/DeleteStudent/DeleteStudentCommand.cs
FILE 16: src/FAMS.Application/Modules/CRM/Commands/DeleteStudent/DeleteStudentCommandHandler.cs
- Soft delete (set IsDeleted = true)

Output all 16 files complete and compilable.
```

---

## PROMPT 2.3 — Admissions Module CQRS

```
Generate the complete CQRS implementation for the Admissions module in FAMS.Application.

FILE 1: src/FAMS.Application/Modules/Admissions/Commands/SubmitApplication/SubmitApplicationCommand.cs
- Record implementing IRequest<Result<Guid>>
- Properties: FirstName, LastName, FatherName, DateOfBirth, Gender, Phone, Email, Address, ProgramId, CampusId, DocumentUrls(List<string>)

FILE 2: src/FAMS.Application/Modules/Admissions/Commands/SubmitApplication/SubmitApplicationCommandValidator.cs
- All fields validated, Phone Pakistani format, Email valid format

FILE 3: src/FAMS.Application/Modules/Admissions/Commands/SubmitApplication/SubmitApplicationCommandHandler.cs
- Creates application record with Status=Applied
- Sends confirmation email via IEmailService
- Returns application Id

FILE 4: src/FAMS.Application/Modules/Admissions/Commands/ReviewApplication/ReviewApplicationCommand.cs
- Record: ReviewApplicationCommand(Guid ApplicationId, ApplicationStatus NewStatus, string ReviewNotes, Guid ReviewedById)

FILE 5: src/FAMS.Application/Modules/Admissions/Commands/ReviewApplication/ReviewApplicationCommandHandler.cs
- Updates application status
- If Status = Offered: calls IEmailService to send offer letter
- If Status = Enrolled: creates Student record via CreateStudentCommandHandler

FILE 6: src/FAMS.Application/Modules/Admissions/Commands/GenerateMeritList/GenerateMeritListCommand.cs
- Record: GenerateMeritListCommand(Guid ProgramId, Guid CampusId, string TermName)

FILE 7: src/FAMS.Application/Modules/Admissions/Commands/GenerateMeritList/GenerateMeritListCommandHandler.cs
- Fetches all applications for program/campus
- Sorts by marks (descending), applies quota rules
- Returns ordered list with rank

FILE 8: src/FAMS.Application/Modules/Admissions/Queries/GetApplications/GetApplicationsQuery.cs
FILE 9: src/FAMS.Application/Modules/Admissions/Queries/GetApplications/GetApplicationsQueryHandler.cs
FILE 10: src/FAMS.Application/Modules/Admissions/Queries/GetApplications/ApplicationDto.cs
- Paginated list of applications filtered by Status, CampusId, ProgramId

FILE 11: src/FAMS.Application/Modules/Admissions/Queries/GetAdmissionsFunnel/GetAdmissionsFunnelQuery.cs
FILE 12: src/FAMS.Application/Modules/Admissions/Queries/GetAdmissionsFunnel/GetAdmissionsFunnelQueryHandler.cs
FILE 13: src/FAMS.Application/Modules/Admissions/Queries/GetAdmissionsFunnel/AdmissionsFunnelDto.cs
- Returns counts per stage: Inquiry, Applied, UnderReview, Offered, Enrolled, Declined
- Calculates conversion rates between stages

Output all 13 files complete and compilable.
```

---

## PROMPT 2.4 — Academic Operations CQRS

```
Generate the complete CQRS for Academic Operations (Attendance + Timetable + Examinations) in FAMS.Application.

--- ATTENDANCE ---

FILE 1: src/FAMS.Application/Modules/Academic/Attendance/Commands/MarkAttendance/MarkAttendanceCommand.cs
- Record: MarkAttendanceCommand with List<AttendanceEntry> Entries, Guid SectionId, DateTime Date, Guid MarkedById
- AttendanceEntry record: StudentId(Guid), IsPresent(bool), IsLate(bool), Remarks(string?)

FILE 2: src/FAMS.Application/Modules/Academic/Attendance/Commands/MarkAttendance/MarkAttendanceCommandHandler.cs
- Bulk inserts attendance records
- Sends absence SMS to parents for absent students via ISmsService
- Handles offline entries (sets IsOfflineEntry=true, SyncedAt=now)

FILE 3: src/FAMS.Application/Modules/Academic/Attendance/Commands/SyncOfflineAttendance/SyncOfflineAttendanceCommand.cs
FILE 4: src/FAMS.Application/Modules/Academic/Attendance/Commands/SyncOfflineAttendance/SyncOfflineAttendanceCommandHandler.cs
- Accepts list of offline attendance records from PWA tablet
- Deduplicates (skip if record already exists for same student+date)
- Marks SyncedAt = DateTime.UtcNow

FILE 5: src/FAMS.Application/Modules/Academic/Attendance/Queries/GetAttendanceReport/GetAttendanceReportQuery.cs
- Record: GetAttendanceReportQuery(Guid SectionId, DateTime StartDate, DateTime EndDate, Guid? StudentId)

FILE 6: src/FAMS.Application/Modules/Academic/Attendance/Queries/GetAttendanceReport/GetAttendanceReportQueryHandler.cs
FILE 7: src/FAMS.Application/Modules/Academic/Attendance/Queries/GetAttendanceReport/AttendanceReportDto.cs
- Returns per-student: TotalDays, PresentDays, AbsentDays, LateDays, AttendancePercentage
- Flags students below 75% threshold as IneligibleForExam

--- TIMETABLE ---

FILE 8: src/FAMS.Application/Modules/Academic/Timetable/Commands/CreateTimetable/CreateTimetableCommand.cs
FILE 9: src/FAMS.Application/Modules/Academic/Timetable/Commands/CreateTimetable/CreateTimetableCommandHandler.cs
- Accepts list of TimetableSlot (Day, StartTime, EndTime, SubjectId, TeacherId, RoomNumber, SectionId)
- Validates: no teacher double-booking, no room conflict, no section overlap
- Returns list of conflict errors if any found

FILE 10: src/FAMS.Application/Modules/Academic/Timetable/Queries/GetTimetable/GetTimetableQuery.cs
FILE 11: src/FAMS.Application/Modules/Academic/Timetable/Queries/GetTimetable/GetTimetableQueryHandler.cs
FILE 12: src/FAMS.Application/Modules/Academic/Timetable/Queries/GetTimetable/TimetableDto.cs
- Returns weekly timetable for a section or teacher

--- EXAMINATIONS ---

FILE 13: src/FAMS.Application/Modules/Academic/Examinations/Commands/CreateExamSchedule/CreateExamScheduleCommand.cs
FILE 14: src/FAMS.Application/Modules/Academic/Examinations/Commands/CreateExamSchedule/CreateExamScheduleCommandHandler.cs
- Creates exam timetable with room allocation
- Checks attendance eligibility before allowing exam registration

FILE 15: src/FAMS.Application/Modules/Academic/Examinations/Commands/GenerateAdmitCards/GenerateAdmitCardsCommand.cs
FILE 16: src/FAMS.Application/Modules/Academic/Examinations/Commands/GenerateAdmitCards/GenerateAdmitCardsCommandHandler.cs
- Filters eligible students (attendance >= threshold, fees cleared)
- Calls IPdfService.GenerateAdmitCard for each student
- Uploads to IStorageService, returns download URLs

Output all 16 files complete and compilable.
```

---

## PROMPT 2.5 — Finance Module CQRS

```
Generate the complete CQRS for the Finance module (Fee Management + Payroll) in FAMS.Application.

--- FEE MANAGEMENT ---

FILE 1: src/FAMS.Application/Modules/Finance/Fee/Commands/GenerateInvoices/GenerateInvoicesCommand.cs
- Record: GenerateInvoicesCommand(Guid CampusId, string TermName, DateTime DueDate)
- Generates fee invoices for ALL active students in a campus for a term

FILE 2: src/FAMS.Application/Modules/Finance/Fee/Commands/GenerateInvoices/GenerateInvoicesCommandHandler.cs
- Gets all active students for campus
- Creates FeeInvoice for each student based on their fee structure
- Skips students who already have an invoice for this term
- Uses Hangfire to run as background job (enqueue, don't block)
- Returns count of invoices generated

FILE 3: src/FAMS.Application/Modules/Finance/Fee/Commands/RecordPayment/RecordPaymentCommand.cs
- Record: RecordPaymentCommand(Guid InvoiceId, decimal Amount, string PaymentMethod, string? TransactionId, Guid ReceivedById)

FILE 4: src/FAMS.Application/Modules/Finance/Fee/Commands/RecordPayment/RecordPaymentCommandValidator.cs
- Amount must be > 0, PaymentMethod must be one of: Cash, BankTransfer, JazzCash, Easypaisa, Cheque

FILE 5: src/FAMS.Application/Modules/Finance/Fee/Commands/RecordPayment/RecordPaymentCommandHandler.cs
- Finds invoice, validates amount does not exceed remaining balance
- Creates FeePayment record
- Updates invoice PaidAmount and Status (Paid if fully paid, PartiallyPaid otherwise)
- Generates receipt number: REC-{CampusCode}-{Year}{Month}-{Sequence}
- Calls IPdfService.GenerateFeeReceiptAsync and emails to parent

FILE 6: src/FAMS.Application/Modules/Finance/Fee/Commands/ApplyLateFee/ApplyLateFeeCommand.cs
FILE 7: src/FAMS.Application/Modules/Finance/Fee/Commands/ApplyLateFee/ApplyLateFeeCommandHandler.cs
- Finds all overdue invoices (DueDate < today, Status != Paid)
- Applies configurable late fee (fixed amount or percentage)
- Updates invoice TotalAmount and Status = Overdue
- Sends SMS reminder to parents

FILE 8: src/FAMS.Application/Modules/Finance/Fee/Queries/GetFeeInvoices/GetFeeInvoicesQuery.cs
FILE 9: src/FAMS.Application/Modules/Finance/Fee/Queries/GetFeeInvoices/GetFeeInvoicesQueryHandler.cs
FILE 10: src/FAMS.Application/Modules/Finance/Fee/Queries/GetFeeInvoices/FeeInvoiceDto.cs
- Filterable by: StudentId, Status, TermName, CampusId, DateRange
- Returns: InvoiceNumber, StudentName, TotalAmount, PaidAmount, Balance, DueDate, Status

FILE 11: src/FAMS.Application/Modules/Finance/Fee/Queries/GetFeeCollectionSummary/GetFeeCollectionSummaryQuery.cs
FILE 12: src/FAMS.Application/Modules/Finance/Fee/Queries/GetFeeCollectionSummary/GetFeeCollectionSummaryQueryHandler.cs
FILE 13: src/FAMS.Application/Modules/Finance/Fee/Queries/GetFeeCollectionSummary/FeeCollectionSummaryDto.cs
- Returns: TotalBilled, TotalCollected, TotalOutstanding, CollectionRate(%), DefaulterCount, ByPaymentMethod breakdown

--- PAYROLL ---

FILE 14: src/FAMS.Application/Modules/Finance/Payroll/Commands/ProcessPayroll/ProcessPayrollCommand.cs
- Record: ProcessPayrollCommand(Guid CampusId, int Month, int Year, Guid ProcessedById)

FILE 15: src/FAMS.Application/Modules/Finance/Payroll/Commands/ProcessPayroll/ProcessPayrollCommandHandler.cs
- Gets all active staff for campus
- For each staff: fetches attendance, calculates deductions (absent days, late days), adds allowances
- Calculates EOBI (employee 1%, employer 5% of BasicSalary)
- Calculates income tax using Pakistani tax slabs (annual income brackets)
- Creates PayrollRecord for each staff
- Returns summary: TotalStaff, TotalGrossSalary, TotalDeductions, TotalNetSalary

FILE 16: src/FAMS.Application/Modules/Finance/Payroll/Commands/ApprovePayroll/ApprovePayrollCommand.cs
FILE 17: src/FAMS.Application/Modules/Finance/Payroll/Commands/ApprovePayroll/ApprovePayrollCommandHandler.cs
- Changes payroll status from Draft to Approved
- Triggers payslip generation for all staff via Hangfire background job

FILE 18: src/FAMS.Application/Modules/Finance/Payroll/Queries/GetPayrollSummary/GetPayrollSummaryQuery.cs
FILE 19: src/FAMS.Application/Modules/Finance/Payroll/Queries/GetPayrollSummary/GetPayrollSummaryQueryHandler.cs
FILE 20: src/FAMS.Application/Modules/Finance/Payroll/Queries/GetPayrollSummary/PayrollSummaryDto.cs

Output all 20 files complete and compilable.
```

---

## PROMPT 2.6 — HRM, Procurement, Assets CQRS

```
Generate CQRS for HRM, Procurement, and Assets modules in FAMS.Application. Follow the same patterns as previous modules.

--- HRM ---

FILE 1: src/FAMS.Application/Modules/HRM/Commands/CreateStaff/CreateStaffCommand.cs
FILE 2: src/FAMS.Application/Modules/HRM/Commands/CreateStaff/CreateStaffCommandValidator.cs
FILE 3: src/FAMS.Application/Modules/HRM/Commands/CreateStaff/CreateStaffCommandHandler.cs

FILE 4: src/FAMS.Application/Modules/HRM/Commands/ApplyLeave/ApplyLeaveCommand.cs
- Record: ApplyLeaveCommand(Guid StaffId, LeaveType LeaveType, DateTime StartDate, DateTime EndDate, string Reason, List<string>? DocumentUrls)
FILE 5: src/FAMS.Application/Modules/HRM/Commands/ApplyLeave/ApplyLeaveCommandValidator.cs
- StartDate must not be in past, EndDate >= StartDate
FILE 6: src/FAMS.Application/Modules/HRM/Commands/ApplyLeave/ApplyLeaveCommandHandler.cs
- Checks leave balance, creates Leave record with Status=Pending

FILE 7: src/FAMS.Application/Modules/HRM/Commands/ApproveLeave/ApproveLeaveCommand.cs
FILE 8: src/FAMS.Application/Modules/HRM/Commands/ApproveLeave/ApproveLeaveCommandHandler.cs
- Approves/rejects leave, deducts from balance if approved, notifies staff via ISmsService

FILE 9: src/FAMS.Application/Modules/HRM/Queries/GetStaffList/GetStaffListQuery.cs
FILE 10: src/FAMS.Application/Modules/HRM/Queries/GetStaffList/GetStaffListQueryHandler.cs
FILE 11: src/FAMS.Application/Modules/HRM/Queries/GetStaffList/StaffDto.cs

FILE 12: src/FAMS.Application/Modules/HRM/Queries/GetHrAnalytics/GetHrAnalyticsQuery.cs
FILE 13: src/FAMS.Application/Modules/HRM/Queries/GetHrAnalytics/GetHrAnalyticsQueryHandler.cs
FILE 14: src/FAMS.Application/Modules/HRM/Queries/GetHrAnalytics/HrAnalyticsDto.cs
- Returns: TotalStaff, ActiveStaff, OnLeave, TurnoverRate(%), LeaveUtilization(%), DepartmentBreakdown

--- PROCUREMENT ---

FILE 15: src/FAMS.Application/Modules/Procurement/Commands/CreatePurchaseRequisition/CreatePurchaseRequisitionCommand.cs
FILE 16: src/FAMS.Application/Modules/Procurement/Commands/CreatePurchaseRequisition/CreatePurchaseRequisitionCommandHandler.cs
- Creates PR with Status=Pending, routes to HOD for approval

FILE 17: src/FAMS.Application/Modules/Procurement/Commands/ApprovePurchaseRequisition/ApprovePurchaseRequisitionCommand.cs
FILE 18: src/FAMS.Application/Modules/Procurement/Commands/ApprovePurchaseRequisition/ApprovePurchaseRequisitionCommandHandler.cs
- Multi-level approval: HOD → Principal → Finance
- If fully approved: auto-generates PurchaseOrder

FILE 19: src/FAMS.Application/Modules/Procurement/Commands/RecordGoodsReceipt/RecordGoodsReceiptCommand.cs
FILE 20: src/FAMS.Application/Modules/Procurement/Commands/RecordGoodsReceiptCommandHandler.cs
- Creates GRN, triggers three-way match (PO+GRN+Invoice)
- If capital asset: triggers Asset.Create() in Assets module

--- ASSETS ---

FILE 21: src/FAMS.Application/Modules/Assets/Commands/RegisterAsset/RegisterAssetCommand.cs
FILE 22: src/FAMS.Application/Modules/Assets/Commands/RegisterAsset/RegisterAssetCommandHandler.cs
- Generates unique AssetCode: {Category}-{CampusCode}-{Sequence}

FILE 23: src/FAMS.Application/Modules/Assets/Commands/CalculateDepreciation/CalculateDepreciationCommand.cs
FILE 24: src/FAMS.Application/Modules/Assets/Commands/CalculateDepreciation/CalculateDepreciationCommandHandler.cs
- Straight-line: (Cost - ResidualValue) / UsefulLifeYears per year
- Reducing balance: CurrentValue * DepreciationRate per year
- Updates Asset.CurrentValue

FILE 25: src/FAMS.Application/Modules/Assets/Queries/GetAssets/GetAssetsQuery.cs
FILE 26: src/FAMS.Application/Modules/Assets/Queries/GetAssets/GetAssetsQueryHandler.cs
FILE 27: src/FAMS.Application/Modules/Assets/Queries/GetAssets/AssetDto.cs

Output all 27 files complete and compilable.
```

---

# ═══════════════════════════════════════════════════════════
# PHASE 3 — INFRASTRUCTURE LAYER
# ═══════════════════════════════════════════════════════════

## PROMPT 3.1 — EF Core DbContext + Configurations

```
Generate the complete Infrastructure/Persistence layer for FAMS.

FILE 1: src/FAMS.Infrastructure/Persistence/FamsDbContext.cs
Complete DbContext that:
- Inherits IdentityDbContext<ApplicationUser, ApplicationRole, Guid>
- Implements IFamsDbContext
- Has DbSet<> for all 18 domain entities
- Constructor: FamsDbContext(DbContextOptions<FamsDbContext> options, ICurrentUserService currentUserService)
- OnModelCreating: calls ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly())
- SaveChangesAsync override: before save, loop all Added/Modified entries of BaseEntity and set CreatedAt/UpdatedAt/CreatedBy/UpdatedBy from ICurrentUserService
- Also set CampusId from ICurrentUserService if entity.CampusId == Guid.Empty

FILE 2: src/FAMS.Infrastructure/Identity/ApplicationUser.cs
- Inherits IdentityUser<Guid>
- Extra properties: FirstName(string), LastName(string), CampusId(Guid), ProfilePhoto(string?), LastLoginAt(DateTime?), IsActive(bool, default true), RefreshToken(string?), RefreshTokenExpiry(DateTime?)

FILE 3: src/FAMS.Infrastructure/Identity/ApplicationRole.cs
- Inherits IdentityRole<Guid>
- Extra: Description(string?), CreatedAt(DateTime)

FILE 4: src/FAMS.Infrastructure/Persistence/Configurations/StudentConfiguration.cs
- IEntityTypeConfiguration<Student>
- Table name: "Students", Schema: "fams"
- Indexes: RollNumber+CampusId (unique), Status, ClassId
- RLS policy: "campus_isolation" — WHERE CampusId = current_campus_id()
- All string length constraints from domain entity

FILE 5: src/FAMS.Infrastructure/Persistence/Configurations/StaffConfiguration.cs
- Same pattern as Student

FILE 6: src/FAMS.Infrastructure/Persistence/Configurations/FeeInvoiceConfiguration.cs
- InvoiceNumber unique per campus
- Decimal precision: TotalAmount (18,2), PaidAmount (18,2), Discount (18,2), LateFee (18,2)

FILE 7: src/FAMS.Infrastructure/Persistence/Configurations/AssetConfiguration.cs
- AssetCode unique per campus
- CurrentValue decimal (18,2)

FILE 8: src/FAMS.Infrastructure/Persistence/Configurations/AuditLogConfiguration.cs
- Table: "AuditLogs", Schema: "fams"
- No RLS on audit logs (all campuses visible to SystemAdmin)
- Index on: EntityName, EntityId, Timestamp

FILE 9: src/FAMS.Infrastructure/Persistence/DbSeeder.cs
- Static class with SeedAsync(IServiceProvider services) method
- Seeds: 10 roles (exact names matching UserRole enum), 1 admin user (admin@fams.local / Admin@12345!), 3 campuses
- All idempotent (check exists before inserting)
- Called from Program.cs only in Development environment

FILE 10: src/FAMS.Infrastructure/Migrations/ (instructions only)
- Give the exact dotnet ef CLI command to create the initial migration from the solution root
- Give the command to apply the migration

Output all files complete and compilable.
```

---

## PROMPT 3.2 — Infrastructure Services

```
Generate all infrastructure service implementations for FAMS.

FILE 1: src/FAMS.Infrastructure/Services/CurrentUserService.cs
- Implements ICurrentUserService
- Constructor: CurrentUserService(IHttpContextAccessor httpContextAccessor)
- Reads UserId from ClaimTypes.NameIdentifier
- Reads CampusId from "campus_id" claim (Guid.Parse)
- Reads Role from ClaimTypes.Role
- Reads UserName from ClaimTypes.Name

FILE 2: src/FAMS.Infrastructure/Services/EmailService.cs
- Implements IEmailService
- Uses MailKit (MimeKit + SmtpClient)
- Configuration: SmtpHost, SmtpPort, SmtpUsername, SmtpPassword, FromName from IConfiguration
- SendAsync: creates MimeMessage with HTML body, connects to SMTP, authenticates, sends
- SendBulkAsync: sends to each recipient individually (loop)
- Proper try/catch with ILogger<EmailService> logging

FILE 3: src/FAMS.Infrastructure/Services/SmsService.cs
- Implements ISmsService
- Uses Twilio SDK (TwilioClient.Init, MessageResource.CreateAsync)
- Configuration: AccountSid, AuthToken, FromNumber from IConfiguration
- SendAsync: sends single SMS
- SendBulkAsync: uses Task.WhenAll for parallel sending
- Polly retry: 3 retries with exponential backoff (2s, 4s, 8s)

FILE 4: src/FAMS.Infrastructure/Services/StorageService.cs
- Implements IStorageService
- Uses AWSSDK.S3 (AmazonS3Client with custom ServiceURL for MinIO)
- Configuration: Endpoint, AccessKey, SecretKey from IConfiguration
- UploadAsync: PutObjectRequest with stream
- DownloadAsync: GetObjectRequest, returns ResponseStream
- DeleteAsync: DeleteObjectRequest
- GetPresignedUrlAsync: GetPreSignedUrlRequest with expiry

FILE 5: src/FAMS.Infrastructure/Services/PdfService.cs
- Implements IPdfService
- Uses QuestPDF
- GenerateFeeReceiptAsync: simple receipt layout with student name, amount, date, receipt number, campus logo area
- GeneratePayslipAsync: payslip with staff name, salary components table, deductions, net pay
- GenerateGradeCardAsync: grade card with student info, subject-wise marks table, total, grade, rank
- GenerateOfferLetterAsync: formal letter format with student name, program, campus, enrollment deadline
- Each method returns byte[] of the PDF

FILE 6: src/FAMS.Infrastructure/Services/AiChatbotService.cs
- Implements IAiChatbotService
- Uses HttpClient to call Anthropic API: POST https://api.anthropic.com/v1/messages
- Headers: x-api-key, anthropic-version: 2023-06-01, Content-Type: application/json
- Body: model from config, max_tokens: 1000, system prompt built from userRole + campusId context, user message
- System prompt tells Claude it is the FAMS AI assistant and should only answer questions about: fee balances, exam schedules, results, timetables, attendance
- Parses response content[0].text
- Polly retry: 2 retries on HttpRequestException

FILE 7: src/FAMS.Infrastructure/Services/DateTimeService.cs
- Implements IDateTime
- Returns DateTime.Now and DateTime.UtcNow

FILE 8: src/FAMS.Infrastructure/DependencyInjection.cs
- Static class with AddInfrastructure(this IServiceCollection services, IConfiguration configuration) extension method
- Registers: FamsDbContext (UseNpgsql), ApplicationUser Identity, Redis (StackExchange), AmazonS3Client (MinIO config), all service implementations, IHttpContextAccessor, Hangfire (UsePostgreSqlStorage)
- Returns IServiceCollection

Output all 8 files complete and compilable.
```

---

# ═══════════════════════════════════════════════════════════
# PHASE 4 — API LAYER
# ═══════════════════════════════════════════════════════════

## PROMPT 4.1 — Program.cs + API Configuration

```
Generate the complete Program.cs and configuration files for FAMS.API.

FILE 1: src/FAMS.API/Program.cs
Complete, production-ready Program.cs that configures IN THIS ORDER:

1. Serilog with Seq sink (read SeqUrl from config), Console sink, structured logging
2. builder.Services.AddInfrastructure(configuration) (from FAMS.Infrastructure)
3. MediatR: AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(FAMS.Application.DependencyInjection).Assembly))
4. FluentValidation: AddValidatorsFromAssembly
5. Pipeline behaviors: ValidationBehavior, LoggingBehavior, AuthorizationBehavior
6. AutoMapper: AddAutoMapper
7. JWT Bearer authentication with exact config (Issuer, Audience, SecretKey from config, validate lifetime, issuer, audience, signing key)
8. Authorization policies:
   - "SystemAdmin": requires role SystemAdmin
   - "PrincipalOrAbove": requires role SystemAdmin OR Principal
   - "TeacherOrAbove": requires role SystemAdmin OR Principal OR AcademicCoordinator OR Teacher
   - "FinanceAccess": requires role SystemAdmin OR Principal OR Accountant
   - "HrAccess": requires role SystemAdmin OR Principal OR HrOfficer
   - "StudentPortal": requires role Student
   - "ParentPortal": requires role Parent
9. CORS: AllowAnyMethod, AllowAnyHeader, specific origins from config
10. Controllers with JSON options (camelCase, ignore null, enum as string)
11. Swagger with JWT bearer security definition
12. SignalR: AddSignalR()
13. Prometheus metrics: UseHttpMetrics()
14. Health checks: AddHealthChecks().AddNpgSql(connString).AddRedis(redisConn)
15. Hangfire dashboard at /hangfire (auth: require SystemAdmin role)

app pipeline:
- UseSerilogRequestLogging()
- UseExceptionHandler (global error handling middleware)
- UseHttpsRedirection()
- UseCors()
- UseAuthentication()
- UseAuthorization()
- UseHttpMetrics()
- MapControllers()
- MapHub<NotificationHub>("/hubs/notifications")
- MapMetrics("/metrics")
- MapHealthChecks("/health")
- MapHangfireDashboard("/hangfire")

Also call DbSeeder.SeedAsync() on startup in Development.

FILE 2: src/FAMS.API/appsettings.json
Complete JSON with all sections: ConnectionStrings, Jwt, Redis, Minio, Seq, Smtp, Twilio, JazzCash, Anthropic, Cors, Hangfire — all values as empty strings or defaults, reading from environment variables where possible

FILE 3: src/FAMS.API/appsettings.Development.json
Development overrides: detailed logging, Swagger enabled, local service URLs

FILE 4: src/FAMS.API/Middleware/GlobalExceptionMiddleware.cs
- Catches all unhandled exceptions
- Returns structured JSON error: { "type", "title", "status", "detail", "traceId" }
- ValidationException → 400
- NotFoundException → 404
- UnauthorizedException → 403
- All others → 500
- Logs with Serilog

FILE 5: src/FAMS.API/Hubs/NotificationHub.cs
- Inherits Hub
- [Authorize] attribute
- Groups: users join group by their CampusId on connect
- Method: SendToCampus(Guid campusId, string type, object data) — sends to campus group
- Method: SendToUser(string userId, string type, object data) — sends to specific user

FILE 6: src/FAMS.API/Extensions/ServiceExtensions.cs
- Helper extension methods for cleaner Program.cs

Output all 6 files complete and compilable.
```

---

## PROMPT 4.2 — All API Controllers

```
Generate ALL controllers for FAMS.API. Every controller must:
- Inherit ControllerBase
- Use [ApiController], [Route("api/v1/[controller]")] attributes
- Inject ISender (MediatR) via constructor
- Return ActionResult<Result<T>>
- Have proper [Authorize] with policy name on each action
- Include XML summary comments
- Return 200/201/400/404 appropriately

Generate these controllers:

FILE 1: src/FAMS.API/Controllers/AuthController.cs
Actions:
- POST /api/v1/auth/login — LoginCommand → returns JWT + RefreshToken
- POST /api/v1/auth/refresh — RefreshTokenCommand → returns new JWT
- POST /api/v1/auth/logout — invalidates refresh token
- POST /api/v1/auth/change-password
- POST /api/v1/auth/mfa/setup — returns TOTP QR code URI
- POST /api/v1/auth/mfa/verify — verifies TOTP code

FILE 2: src/FAMS.API/Controllers/StudentsController.cs
Actions:
- GET /api/v1/students — GetStudentsQuery (paginated, filterable) [TeacherOrAbove]
- GET /api/v1/students/{id} — GetStudentByIdQuery [TeacherOrAbove]
- POST /api/v1/students — CreateStudentCommand [PrincipalOrAbove]
- PUT /api/v1/students/{id} — UpdateStudentCommand [PrincipalOrAbove]
- DELETE /api/v1/students/{id} — DeleteStudentCommand [SystemAdmin]
- PATCH /api/v1/students/{id}/status — UpdateStudentStatusCommand [PrincipalOrAbove]
- GET /api/v1/students/{id}/attendance — GetStudentAttendanceQuery
- GET /api/v1/students/{id}/results — GetStudentResultsQuery
- GET /api/v1/students/{id}/fees — GetStudentFeesQuery

FILE 3: src/FAMS.API/Controllers/AdmissionsController.cs
Actions:
- POST /api/v1/admissions/apply — SubmitApplicationCommand [AllowAnonymous]
- GET /api/v1/admissions/applications — GetApplicationsQuery [PrincipalOrAbove]
- PATCH /api/v1/admissions/applications/{id}/review — ReviewApplicationCommand [PrincipalOrAbove]
- POST /api/v1/admissions/merit-list — GenerateMeritListCommand [PrincipalOrAbove]
- GET /api/v1/admissions/funnel — GetAdmissionsFunnelQuery [PrincipalOrAbove]

FILE 4: src/FAMS.API/Controllers/AttendanceController.cs
Actions:
- POST /api/v1/attendance/mark — MarkAttendanceCommand [TeacherOrAbove]
- POST /api/v1/attendance/sync-offline — SyncOfflineAttendanceCommand [TeacherOrAbove]
- GET /api/v1/attendance/report — GetAttendanceReportQuery [TeacherOrAbove]
- GET /api/v1/attendance/my — GetMyAttendanceQuery [StudentPortal]

FILE 5: src/FAMS.API/Controllers/TimetableController.cs
Actions:
- POST /api/v1/timetable — CreateTimetableCommand [PrincipalOrAbove]
- GET /api/v1/timetable/section/{sectionId} — GetTimetableQuery [TeacherOrAbove]
- GET /api/v1/timetable/my — GetMyTimetableQuery [TeacherOrAbove OR StudentPortal]

FILE 6: src/FAMS.API/Controllers/ExaminationsController.cs
Actions:
- POST /api/v1/examinations/schedule — CreateExamScheduleCommand [PrincipalOrAbove]
- POST /api/v1/examinations/admit-cards — GenerateAdmitCardsCommand [PrincipalOrAbove]
- GET /api/v1/examinations/my-schedule — GetMyExamScheduleQuery [StudentPortal]

FILE 7: src/FAMS.API/Controllers/ResultsController.cs
Actions:
- POST /api/v1/results/marks — EnterMarksCommand [TeacherOrAbove]
- POST /api/v1/results/publish — PublishResultsCommand [PrincipalOrAbove]
- GET /api/v1/results/student/{studentId} — GetStudentResultsQuery [TeacherOrAbove]
- GET /api/v1/results/my — GetMyResultsQuery [StudentPortal OR ParentPortal]
- GET /api/v1/results/analytics — GetResultsAnalyticsQuery [PrincipalOrAbove]

FILE 8: src/FAMS.API/Controllers/FeeController.cs
Actions:
- POST /api/v1/fee/generate-invoices — GenerateInvoicesCommand [FinanceAccess]
- POST /api/v1/fee/record-payment — RecordPaymentCommand [FinanceAccess]
- POST /api/v1/fee/apply-late-fee — ApplyLateFeeCommand [FinanceAccess]
- GET /api/v1/fee/invoices — GetFeeInvoicesQuery [FinanceAccess]
- GET /api/v1/fee/my-invoices — GetMyInvoicesQuery [StudentPortal OR ParentPortal]
- GET /api/v1/fee/summary — GetFeeCollectionSummaryQuery [FinanceAccess]

FILE 9: src/FAMS.API/Controllers/PayrollController.cs
Actions:
- POST /api/v1/payroll/process — ProcessPayrollCommand [FinanceAccess]
- POST /api/v1/payroll/approve — ApprovePayrollCommand [PrincipalOrAbove]
- GET /api/v1/payroll/summary — GetPayrollSummaryQuery [FinanceAccess]
- GET /api/v1/payroll/my-payslip — GetMyPayslipQuery [TeacherOrAbove]

FILE 10: src/FAMS.API/Controllers/HrmController.cs
Actions:
- GET /api/v1/hrm/staff — GetStaffListQuery [HrAccess]
- POST /api/v1/hrm/staff — CreateStaffCommand [HrAccess]
- POST /api/v1/hrm/leave/apply — ApplyLeaveCommand [TeacherOrAbove]
- POST /api/v1/hrm/leave/approve — ApproveLeaveCommand [HrAccess]
- GET /api/v1/hrm/analytics — GetHrAnalyticsQuery [HrAccess]

FILE 11: src/FAMS.API/Controllers/ProcurementController.cs
Actions:
- POST /api/v1/procurement/requisition — CreatePurchaseRequisitionCommand [PrincipalOrAbove]
- POST /api/v1/procurement/requisition/{id}/approve — ApprovePurchaseRequisitionCommand [PrincipalOrAbove]
- POST /api/v1/procurement/grn — RecordGoodsReceiptCommand [PrincipalOrAbove]

FILE 12: src/FAMS.API/Controllers/AssetsController.cs
Actions:
- POST /api/v1/assets — RegisterAssetCommand [SystemAdmin]
- GET /api/v1/assets — GetAssetsQuery [PrincipalOrAbove]
- POST /api/v1/assets/depreciation — CalculateDepreciationCommand [SystemAdmin]

FILE 13: src/FAMS.API/Controllers/ChatbotController.cs
Actions:
- POST /api/v1/chatbot/message — ChatbotMessageCommand → calls IAiChatbotService [Authorize]

FILE 14: src/FAMS.API/Controllers/DashboardController.cs
Actions:
- GET /api/v1/dashboard/executive — GetExecutiveDashboardQuery [SystemAdmin OR Executive]
- GET /api/v1/dashboard/principal — GetPrincipalDashboardQuery [PrincipalOrAbove]
- GET /api/v1/dashboard/teacher — GetTeacherDashboardQuery [TeacherOrAbove]
- GET /api/v1/dashboard/student — GetStudentDashboardQuery [StudentPortal]
- GET /api/v1/dashboard/parent — GetParentDashboardQuery [ParentPortal]

FILE 15: src/FAMS.API/Controllers/HealthController.cs
- GET /health → returns 200 OK with {"status":"healthy","timestamp":"..."}
- [AllowAnonymous]

Output all 15 controller files complete and compilable.
```

---

# ═══════════════════════════════════════════════════════════
# PHASE 5 — AUTHENTICATION
# ═══════════════════════════════════════════════════════════

## PROMPT 5.1 — Complete Auth System

```
Generate the complete authentication system for FAMS including JWT, Refresh Tokens, and TOTP MFA.

FILE 1: src/FAMS.Application/Modules/Auth/Commands/Login/LoginCommand.cs
- Record: LoginCommand(string Email, string Password, string? TotpCode)

FILE 2: src/FAMS.Application/Modules/Auth/Commands/Login/LoginCommandHandler.cs
- Find user by email using UserManager<ApplicationUser>
- Verify password using UserManager.CheckPasswordAsync
- If MFA enabled: validate TOTP code using UserManager.VerifyTwoFactorTokenAsync
- Generate JWT access token (30 min expiry) with claims: userId, email, role, campusId, name
- Generate refresh token (random 64-byte Base64, 7 days expiry)
- Save refresh token + expiry to user record
- Update LastLoginAt
- Return: AccessToken, RefreshToken, ExpiresAt, UserId, Role, CampusId, FullName

FILE 3: src/FAMS.Application/Modules/Auth/Commands/Login/LoginDto.cs
- Record with all return fields above

FILE 4: src/FAMS.Application/Modules/Auth/Commands/RefreshToken/RefreshTokenCommand.cs
FILE 5: src/FAMS.Application/Modules/Auth/Commands/RefreshToken/RefreshTokenCommandHandler.cs
- Validate JWT (ignore lifetime), extract userId
- Find user, verify stored RefreshToken matches and not expired
- Generate new JWT and new RefreshToken
- Rotate refresh token (save new one, invalidate old)

FILE 6: src/FAMS.Application/Modules/Auth/Commands/Logout/LogoutCommand.cs
FILE 7: src/FAMS.Application/Modules/Auth/Commands/Logout/LogoutCommandHandler.cs
- Clear RefreshToken and RefreshTokenExpiry from user record

FILE 8: src/FAMS.Application/Modules/Auth/Commands/ChangePassword/ChangePasswordCommand.cs
FILE 9: src/FAMS.Application/Modules/Auth/Commands/ChangePassword/ChangePasswordCommandHandler.cs
- Uses UserManager.ChangePasswordAsync
- Returns error if old password wrong

FILE 10: src/FAMS.Application/Modules/Auth/Commands/SetupMfa/SetupMfaCommand.cs
FILE 11: src/FAMS.Application/Modules/Auth/Commands/SetupMfa/SetupMfaCommandHandler.cs
- Uses UserManager.GetAuthenticatorKeyAsync (generates key if none)
- Returns otpauth:// URI for QR code display
- Format: otpauth://totp/FAMS:{email}?secret={key}&issuer=FAMS

FILE 12: src/FAMS.Application/Modules/Auth/Commands/VerifyMfa/VerifyMfaCommand.cs
FILE 13: src/FAMS.Application/Modules/Auth/Commands/VerifyMfa/VerifyMfaCommandHandler.cs
- Verifies TOTP code using UserManager.VerifyTwoFactorTokenAsync
- If valid: enables 2FA with UserManager.SetTwoFactorEnabledAsync

FILE 14: src/FAMS.Infrastructure/Services/JwtTokenService.cs
- Generates JWT using System.IdentityModel.Tokens.Jwt
- Claims: NameIdentifier(userId), Email, Name(fullName), Role, "campus_id"(campusId), Jti(newGuid)
- Signs with HmacSha256 using SecretKey from config
- Sets Issuer, Audience, Expires from config
- Also method: GetPrincipalFromExpiredToken(string token) — validates everything except lifetime

Output all 14 files complete and compilable.
```

---

# ═══════════════════════════════════════════════════════════
# PHASE 6 — FRONTEND
# ═══════════════════════════════════════════════════════════

## PROMPT 6.1 — React Project Setup

```
Generate the complete frontend setup for FAMS React application.

FILE 1: frontend/package.json
Exact versions for all packages:
- react@18.3.1, react-dom@18.3.1
- typescript@5.5.3
- vite@5.4.1, @vitejs/plugin-react@4.3.1
- tailwindcss@3.4.10, postcss@8.4.41, autoprefixer@10.4.20
- @tanstack/react-query@5.56.2, @tanstack/react-query-devtools@5.56.2
- axios@1.7.7
- react-router-dom@6.26.2
- recharts@2.12.7
- @microsoft/signalr@8.0.7
- lucide-react@0.439.0
- react-hook-form@7.53.0
- @hookform/resolvers@3.9.0
- zod@3.23.8
- date-fns@3.6.0
- react-hot-toast@2.4.1
- @radix-ui/react-dialog@1.1.1
- @radix-ui/react-dropdown-menu@2.1.1
- @radix-ui/react-select@2.1.1
- @radix-ui/react-tabs@1.1.0
- @radix-ui/react-tooltip@1.1.2
- Dev: all @types, eslint, prettier, playwright@1.47.2

FILE 2: frontend/vite.config.ts
- React plugin
- Path alias: @ → ./src
- Proxy: /api → http://localhost:5000 (changeOrigin: true)
- Proxy: /hubs → http://localhost:5000 (ws: true, changeOrigin: true)
- Build: outDir dist, sourcemap in dev only

FILE 3: frontend/tailwind.config.ts
- Content: ./src/**/*.{ts,tsx}
- Theme extend colors:
  - primary: { 50:#E6F1FB, 500:#2E75B6, 700:#1B4F8A, 900:#042C53 }
  - secondary: { 50:#E1F5EE, 500:#1D9E75, 700:#0F6E56 }
  - danger: { 500:#E24B4A }
  - warning: { 500:#EF9F27 }

FILE 4: frontend/tsconfig.json
- Strict mode, target ES2020, paths: @/* → [./src/*]

FILE 5: frontend/src/lib/axiosClient.ts
- Base Axios instance with VITE_API_URL baseURL
- Request interceptor: reads access_token from localStorage, adds Authorization: Bearer header
- Response interceptor:
  - On 401: call /api/v1/auth/refresh with refresh_token from localStorage
  - On success: update stored tokens, retry original request
  - On refresh fail: clear tokens, redirect to /login
  - Prevent infinite loop with _retry flag

FILE 6: frontend/src/lib/signalrClient.ts
- Creates HubConnection to /hubs/notifications
- withAutomaticReconnect([0, 2000, 10000, 30000])
- Adds JWT token from localStorage in accessTokenFactory
- Export: startConnection(), stopConnection(), onNotification(type, callback)

FILE 7: frontend/src/store/authStore.ts
- Zustand store (or React Context if Zustand not in packages)
- State: user(null | UserDto), isAuthenticated, isLoading
- Actions: login(credentials), logout(), refreshUser()
- Persists to localStorage

FILE 8: frontend/src/types/api.types.ts
- TypeScript interfaces for all API DTOs:
  - LoginDto, StudentDto, StudentDetailDto, FeeInvoiceDto, AttendanceReportDto, etc.
  - PaginatedList<T> interface
  - Result<T> interface matching backend

FILE 9: frontend/src/App.tsx
- React Router v6 with BrowserRouter
- Routes:
  - /login → LoginPage (public)
  - / → redirect to /dashboard
  - /dashboard → DashboardPage (protected, role-based component)
  - /students → StudentsPage (protected, TeacherOrAbove)
  - /admissions → AdmissionsPage (protected, PrincipalOrAbove)
  - /attendance → AttendancePage (protected, TeacherOrAbove)
  - /results → ResultsPage (protected)
  - /fee → FeePage (protected, FinanceAccess)
  - /payroll → PayrollPage (protected, FinanceAccess)
  - /hrm → HrmPage (protected, HrAccess)
  - /assets → AssetsPage (protected, SystemAdmin)
- ProtectedRoute component: checks isAuthenticated, redirects to /login if not

FILE 10: frontend/src/components/layout/AppLayout.tsx
- Sidebar navigation with links to all modules
- Top header with user name, campus name, logout button
- Notification bell (connected to SignalR)
- Responsive: collapsible sidebar on mobile

Output all 10 files complete and compilable TypeScript.
```

---

## PROMPT 6.2 — Frontend Pages (Core)

```
Generate the core frontend pages for FAMS. Use Tailwind CSS, React Hook Form + Zod for forms, TanStack Query for data fetching.

FILE 1: frontend/src/pages/auth/LoginPage.tsx
- Email + Password fields using React Hook Form + Zod validation
- Show TOTP field if server returns 'mfa_required'
- On success: store tokens in localStorage via authStore, redirect to /dashboard
- Error display on invalid credentials
- FAMS logo placeholder, clean centered card layout

FILE 2: frontend/src/pages/dashboard/DashboardPage.tsx
- Reads user role from authStore
- Renders role-specific dashboard component:
  - SystemAdmin/Executive → ExecutiveDashboard
  - Principal → PrincipalDashboard
  - Teacher → TeacherDashboard
  - Student → StudentDashboard
  - Parent → ParentDashboard

FILE 3: frontend/src/pages/dashboard/PrincipalDashboard.tsx
- KPI cards: Total Students, Attendance Today(%), Fee Collection This Month, Staff Count
- Charts: enrollment trend (line chart, recharts), fee collection by month (bar chart)
- Recent activity feed
- All data from GET /api/v1/dashboard/principal via TanStack Query

FILE 4: frontend/src/pages/students/StudentsPage.tsx
- Data table with columns: Roll No, Name, Class, Section, Status, Phone, Actions
- Search input (debounced 300ms)
- Filter by Class, Status dropdowns
- Pagination controls
- Add Student button → opens CreateStudentDialog
- Row click → navigates to /students/{id}

FILE 5: frontend/src/pages/students/StudentDetailPage.tsx
- Student profile card (photo, name, status badge, contact info)
- Tabs: Overview, Attendance, Results, Fees, Documents
- Each tab fetches its own data lazily on tab switch

FILE 6: frontend/src/pages/attendance/AttendancePage.tsx
- Date picker (default: today)
- Section selector
- Student list with Present/Absent toggle for each (tablet-friendly large touch targets)
- Submit button → calls MarkAttendanceCommand
- Offline indicator: shows banner if navigator.onLine === false
- When offline: stores in IndexedDB (Dexie), shows pending sync count
- When back online: calls sync-offline endpoint automatically

FILE 7: frontend/src/pages/fee/FeePage.tsx
- Tabs: Invoices, Payments, Summary
- Invoices tab: filterable table of all invoices with status badges (color-coded)
- Record Payment dialog: invoice selection, amount, payment method dropdown
- Summary tab: collection stats cards + bar chart by payment method

FILE 8: frontend/src/components/ui/DataTable.tsx
- Reusable generic table component
- Props: columns(ColumnDef[]), data(T[]), isLoading, pagination
- Shows skeleton rows while loading
- Empty state with icon

FILE 9: frontend/src/components/ui/KpiCard.tsx
- Props: title, value, trend(up|down|neutral), trendValue, icon, color
- Compact card with colored icon, main value, trend arrow

FILE 10: frontend/src/components/chatbot/ChatbotWidget.tsx
- Floating chat bubble button (bottom-right)
- Opens chat panel on click
- Message history display
- Input field + send button
- Calls POST /api/v1/chatbot/message
- Shows typing indicator while waiting for AI response
- Role-aware: sends current user role with each message

Output all 10 files complete, correct TypeScript, using the libraries in package.json.
```

---

# ═══════════════════════════════════════════════════════════
# PHASE 7 — DOCKER & INFRASTRUCTURE
# ═══════════════════════════════════════════════════════════

## PROMPT 7.1 — Complete Docker Setup

```
Generate the complete Docker infrastructure for FAMS local deployment.

FILE 1: docker-compose.yml
Complete file with these exact services:

fams-api:
  build: ./src/FAMS.API
  container_name: fams-api
  ports: ["5000:5000"]
  environment: (all from .env file)
  depends_on: postgres (healthy), redis (healthy), minio (healthy), seq
  healthcheck: curl -f http://localhost:5000/health || exit 1
  restart: unless-stopped
  networks: [fams-network]

fams-frontend:
  build: ./frontend
  container_name: fams-frontend
  ports: ["3000:80"]
  depends_on: [fams-api]
  restart: unless-stopped
  networks: [fams-network]

postgres:
  image: postgres:16-alpine
  container_name: fams-postgres
  ports: ["5432:5432"]
  environment: POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD from .env
  volumes: [postgres_data:/var/lib/postgresql/data, ./infra/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql]
  healthcheck: pg_isready -U ${POSTGRES_USER}
  restart: unless-stopped
  networks: [fams-network]

redis:
  image: redis:7-alpine
  container_name: fams-redis
  ports: ["6379:6379"]
  command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
  volumes: [redis_data:/data]
  healthcheck: redis-cli ping
  restart: unless-stopped
  networks: [fams-network]

minio:
  image: minio/minio:latest
  container_name: fams-minio
  ports: ["9000:9000", "9001:9001"]
  environment: MINIO_ROOT_USER, MINIO_ROOT_PASSWORD from .env
  command: server /data --console-address ":9001"
  volumes: [minio_data:/data]
  healthcheck: curl -f http://localhost:9000/minio/health/live || exit 1
  restart: unless-stopped
  networks: [fams-network]

minio-init:
  image: minio/mc:latest
  depends_on: minio (healthy)
  entrypoint: >
    /bin/sh -c "
    mc alias set myminio http://minio:9000 ${MINIO_ROOT_USER} ${MINIO_ROOT_PASSWORD};
    mc mb myminio/fams-documents --ignore-existing;
    mc mb myminio/fams-exports --ignore-existing;
    mc mb myminio/fams-avatars --ignore-existing;
    mc anonymous set download myminio/fams-avatars;
    exit 0;"
  networks: [fams-network]

seq:
  image: datalust/seq:latest
  container_name: fams-seq
  ports: ["5341:5341", "8081:80"]
  environment: ACCEPT_EULA=Y
  volumes: [seq_data:/data]
  restart: unless-stopped
  networks: [fams-network]

prometheus:
  image: prom/prometheus:latest
  container_name: fams-prometheus
  ports: ["9090:9090"]
  volumes: [./infra/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml]
  command: --config.file=/etc/prometheus/prometheus.yml
  restart: unless-stopped
  networks: [fams-network]

grafana:
  image: grafana/grafana:latest
  container_name: fams-grafana
  ports: ["3001:3000"]
  environment: GF_SECURITY_ADMIN_USER, GF_SECURITY_ADMIN_PASSWORD from .env
  volumes: [grafana_data:/var/lib/grafana, ./infra/grafana/provisioning:/etc/grafana/provisioning]
  restart: unless-stopped
  networks: [fams-network]

volumes: postgres_data, redis_data, minio_data, seq_data, grafana_data
networks: fams-network (bridge)

FILE 2: src/FAMS.API/Dockerfile
Multi-stage:
Stage 1 (build): mcr.microsoft.com/dotnet/sdk:8.0
- WORKDIR /app
- Copy .csproj files and restore (layer caching)
- Copy all source
- dotnet publish -c Release -o /app/publish

Stage 2 (runtime): mcr.microsoft.com/dotnet/aspnet:8.0
- WORKDIR /app
- Create non-root user: adduser --disabled-password --gecos "" appuser
- COPY --from=build /app/publish .
- USER appuser
- EXPOSE 5000
- ENV ASPNETCORE_URLS=http://+:5000
- ENTRYPOINT ["dotnet", "FAMS.API.dll"]

FILE 3: frontend/Dockerfile
Stage 1 (build): node:20-alpine
- WORKDIR /app
- Copy package.json + package-lock.json
- npm ci --only=production=false
- Copy all source
- npm run build

Stage 2 (serve): nginx:alpine
- COPY --from=build /app/dist /usr/share/nginx/html
- COPY ./nginx.conf /etc/nginx/conf.d/default.conf
- EXPOSE 80

FILE 4: frontend/nginx.conf
- serve /usr/share/nginx/html
- try_files $uri $uri/ /index.html (SPA fallback)
- gzip on for js, css, json, svg
- cache headers: 1 year for hashed assets, no-cache for index.html
- location /api/ { proxy_pass http://fams-api:5000/; }

FILE 5: infra/postgres/init.sql
Complete SQL:
- CREATE EXTENSION uuid-ossp, pgcrypto
- CREATE SCHEMA fams
- CREATE FUNCTION current_campus_id() RETURNS UUID
- Seed 3 campuses
- Comment explaining EF migrations will create tables on first run

FILE 6: infra/prometheus/prometheus.yml
- scrape_interval: 15s
- scrape_configs: job fams-api, target fams-api:5000, metrics_path /metrics

FILE 7: infra/grafana/provisioning/datasources/datasource.yml
- Prometheus datasource pointing to http://prometheus:9090

FILE 8: docker-compose.override.yml
Development overrides:
- fams-api: environment ASPNETCORE_ENVIRONMENT=Development, volume mount source for hot reload
- Additional debug ports

Output all 8 files with complete, exact content.
```

---

# ═══════════════════════════════════════════════════════════
# PHASE 8 — TESTING
# ═══════════════════════════════════════════════════════════

## PROMPT 8.1 — Unit Tests

```
Generate unit tests for FAMS core business logic.

FILE 1: tests/FAMS.UnitTests/Modules/CRM/CreateStudentCommandHandlerTests.cs
Test class with these test methods (xUnit, Moq, FluentAssertions):
- Handle_ValidCommand_ReturnsSuccessWithStudentId
- Handle_DuplicateRollNumber_ReturnsFailureResult
- Handle_InvalidCampusId_ReturnsFailureResult
Each test: Arrange (mock IFamsDbContext, set up data), Act (call handler), Assert (FluentAssertions)

FILE 2: tests/FAMS.UnitTests/Modules/Finance/ProcessPayrollCommandHandlerTests.cs
- Handle_ValidCommand_ProcessesAllActiveStaff
- Handle_CalculatesEOBICorrectly — verify 1% employee + 5% employer of BasicSalary
- Handle_CalculatesIncomeTaxCorrectly — test with salary below tax threshold (returns 0 tax)
- Handle_CalculatesIncomeTaxForHighSalary — salary above threshold gets correct tax

FILE 3: tests/FAMS.UnitTests/Modules/Finance/RecordPaymentCommandHandlerTests.cs
- Handle_ValidPayment_UpdatesInvoiceStatus
- Handle_FullPayment_SetsStatusToPaid
- Handle_PartialPayment_SetsStatusToPartiallyPaid
- Handle_OverpaymentAttempt_ReturnsFailure

FILE 4: tests/FAMS.UnitTests/Modules/Academic/MarkAttendanceCommandHandlerTests.cs
- Handle_ValidEntries_SavesAttendanceRecords
- Handle_AbsentStudent_SendsSmsToParent
- Handle_OfflineEntry_SetsIsOfflineEntryTrue

FILE 5: tests/FAMS.UnitTests/Common/ValidationBehaviorTests.cs
- Handle_ValidRequest_PassesThrough
- Handle_InvalidRequest_ReturnsValidationErrors
- Handle_MultipleValidationErrors_ReturnsAllErrors

FILE 6: tests/FAMS.UnitTests/Services/JwtTokenServiceTests.cs
- GenerateToken_ValidUser_ReturnsValidJwt
- GenerateToken_ContainsCampusIdClaim
- GetPrincipalFromExpiredToken_ExpiredToken_ReturnsPrincipal
- GetPrincipalFromExpiredToken_TamperedToken_ThrowsException

Output all 6 test files with complete test implementations. No empty test bodies.
```

---

## PROMPT 8.2 — Integration Tests

```
Generate integration tests for FAMS API endpoints using Testcontainers.

FILE 1: tests/FAMS.IntegrationTests/Infrastructure/FamsWebApplicationFactory.cs
- Inherits WebApplicationFactory<Program>
- Uses Testcontainers: PostgreSqlContainer + RedisContainer
- Overrides ConfigureWebHost: replace real connection strings with test container connection strings
- Disable real external services (Mock IEmailService, ISmsService, IStorageService, IAiChatbotService)
- Override IDateTime with fixed test time
- Implements IAsyncLifetime: starts containers in InitializeAsync, disposes in DisposeAsync

FILE 2: tests/FAMS.IntegrationTests/Infrastructure/BaseIntegrationTest.cs
- Abstract base class all integration tests inherit
- Has HttpClient (from factory)
- Helper: AuthenticateAsAdmin() — posts to /auth/login with seed admin creds, stores JWT
- Helper: AuthenticateAs(string role) — creates test user with given role, returns client with token
- Implements IClassFixture<FamsWebApplicationFactory>

FILE 3: tests/FAMS.IntegrationTests/Endpoints/Auth/LoginEndpointTests.cs
- POST_Login_ValidCredentials_Returns200WithTokens
- POST_Login_InvalidPassword_Returns401
- POST_Login_NonExistentUser_Returns401
- POST_Login_ValidCredentials_TokenContainsCampusId

FILE 4: tests/FAMS.IntegrationTests/Endpoints/Students/StudentsEndpointTests.cs
- GET_Students_AsTeacher_Returns200WithPaginatedList
- GET_Students_AsStudent_Returns403 (wrong role)
- POST_Student_AsPrincipal_Returns201WithId
- POST_Student_AsTeacher_Returns403 (wrong role)
- GET_StudentById_ValidId_Returns200
- GET_StudentById_InvalidId_Returns404

FILE 5: tests/FAMS.IntegrationTests/Endpoints/Fee/FeeEndpointTests.cs
- POST_GenerateInvoices_AsAccountant_Returns200
- POST_GenerateInvoices_AsTeacher_Returns403
- POST_RecordPayment_ValidData_Returns200
- POST_RecordPayment_AmountExceedsBalance_Returns400

Output all 5 files complete and compilable.
```

---

# ═══════════════════════════════════════════════════════════
# PHASE 9 — CI/CD + FINAL CONFIG
# ═══════════════════════════════════════════════════════════

## PROMPT 9.1 — GitHub Actions + VS Code Config

```
Generate the final configuration files for FAMS.

FILE 1: .github/workflows/ci.yml
Complete GitHub Actions workflow:

name: FAMS CI/CD

on:
  push: branches [main, develop]
  pull_request: branches [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env: POSTGRES_DB=fams_test, POSTGRES_USER=test, POSTGRES_PASSWORD=test
        ports: ["5432:5432"]
        options: health checks
      redis:
        image: redis:7-alpine
        ports: ["6379:6379"]
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-dotnet@v4 with dotnet-version: '8.0.x'
    - uses: actions/setup-node@v4 with node-version: '20'
    - name: Restore NuGet → dotnet restore
    - name: Build → dotnet build --no-restore -c Release
    - name: Unit Tests → dotnet test tests/FAMS.UnitTests --no-build -c Release --collect:"XPlat Code Coverage"
    - name: Integration Tests → dotnet test tests/FAMS.IntegrationTests --no-build -c Release
    - name: Upload coverage → codecov action
    - name: Frontend Install → cd frontend && npm ci
    - name: Frontend Lint → npm run lint
    - name: Frontend Build → npm run build
    - name: Frontend Type Check → npm run type-check

  docker-build:
    needs: build-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions: packages: write
    steps:
    - uses: actions/checkout@v4
    - uses: docker/login-action@v3 with registry: ghcr.io
    - name: Build API image → docker build -t ghcr.io/${{ github.repository }}/fams-api:${{ github.sha }} ./src/FAMS.API
    - name: Build Frontend image → docker build -t ghcr.io/${{ github.repository }}/fams-frontend:${{ github.sha }} ./frontend
    - name: Push images
    - name: Tag latest → also tag :latest

FILE 2: .vscode/extensions.json
{
  "recommendations": [
    "ms-dotnettools.csdevkit",
    "ms-dotnettools.csharp",
    "ms-dotnettools.vscode-dotnet-runtime",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-azuretools.vscode-docker",
    "humao.rest-client",
    "eamodio.gitlens",
    "PKief.material-icon-theme",
    "usernamehw.errorlens",
    "streetsidesoftware.code-spell-checker"
  ]
}

FILE 3: .vscode/launch.json
Configurations:
- "FAMS API" → type: coreclr, request: launch, project: src/FAMS.API/FAMS.API.csproj, env: ASPNETCORE_ENVIRONMENT=Development
- "FAMS API (Docker attach)" → type: docker, request: attach, containerName: fams-api
- "Chrome (Frontend)" → type: chrome, url: http://localhost:3000, webRoot: ${workspaceFolder}/frontend/src

FILE 4: .vscode/tasks.json
Tasks:
- "docker: up" → docker compose up -d, group: build
- "docker: down" → docker compose down
- "docker: logs" → docker compose logs -f fams-api
- "ef: add migration" → prompts for migration name, runs dotnet ef migrations add {input} --project src/FAMS.Infrastructure --startup-project src/FAMS.API
- "ef: update database" → dotnet ef database update --project src/FAMS.Infrastructure --startup-project src/FAMS.API
- "test: unit" → dotnet test tests/FAMS.UnitTests
- "test: integration" → dotnet test tests/FAMS.IntegrationTests
- "test: all" → dotnet test

FILE 5: .env.example
Complete file with ALL environment variables, comments, and safe default values for local development (no real secrets)

FILE 6: README.md
Complete README with:
- Project badges (build status, coverage)
- One-command quickstart section
- Full port map table
- Default credentials
- Module list with FR IDs
- Architecture diagram (ASCII)
- How to add a new module (step-by-step)
- How to run migrations
- How to run tests
- How to deploy to Azure (commands)
- Contributing guide

Output all 6 files with complete content.
```

---

# ═══════════════════════════════════════════════════════════
# USAGE GUIDE
# ═══════════════════════════════════════════════════════════

## How To Use These Prompts

**Option A — Claude Code (Recommended)**
```bash
# Navigate to your solution root
cd path/to/FAMS

# Start Claude Code
claude

# Then paste each prompt one at a time in order
```

**Option B — Claude Chat**
Copy each prompt block (the text inside the triple backtick blocks) and paste directly into this chat. Claude will generate all the files. Copy the output into your project.

**Recommended Order:**
```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8 → Phase 9
```

**After Phase 0 and before Phase 3, run:**
```bash
# Create the initial EF Core migration
dotnet ef migrations add InitialCreate \
  --project src/FAMS.Infrastructure \
  --startup-project src/FAMS.API

# Apply to database (make sure Docker postgres is running)
dotnet ef database update \
  --project src/FAMS.Infrastructure \
  --startup-project src/FAMS.API
```

**After all phases, verify everything works:**
```bash
# Start all services
docker compose up -d

# Wait 30 seconds, then check
curl http://localhost:5000/health
# Should return: {"status":"healthy"}

# Open browser
# Frontend:  http://localhost:8080
# Swagger:   http://localhost:5000/swagger
# Seq Logs:  http://localhost:8081
# Grafana:   http://localhost:3001
# MinIO:     http://localhost:9001

# Login
# Email:    admin@fams.local
# Password: Admin@12345!
```

---

*Total prompts: 20 | Total phases: 9 | Covers: All 8 PRD modules + Auth + Infrastructure + Testing + CI/CD*
