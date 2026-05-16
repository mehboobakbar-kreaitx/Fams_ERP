# FAMS — Gap Closure Master Prompt (v1)

**Source of truth:** `D:\FAMS\src\FAMS\docs\FAMS PRD VERSION 1.pdf` (extracted text in `_PRD_extracted.txt`).
**Goal:** Bring the current FAMS implementation to PRD compliance, in deliverable slices.
**Working directory:** `D:\FAMS\src\FAMS`.

This document is the authoritative gap list. The current build is healthy (backend 0 errors, frontend 0 TS errors, Docker stack running, login works, 24 students + 8 staff + 24 invoices seeded). The PRD specifies **31 campuses** and **8 functional modules + cross-cutting platform features**. Below is a per-FR status table and the work needed to close every gap.

---

## Legend
- ✅ **Done** — meets the PRD requirement, verified working.
- ⚠️ **Partial** — implemented but missing pieces called out below.
- ❌ **Missing** — not started.

---

## Module 7.1 — CRM (Student & Parent Management)

| FR | Requirement | Status | Gap to close |
| --- | --- | --- | --- |
| FR-CRM-01 | Student profile CRUD + archive | ✅ | — |
| FR-CRM-02 | Parent/Guardian profiles | ⚠️ | `Parent` entity exists, but no CRUD commands/queries/endpoints; no portal-credential issuance. Need `CreateParentCommand`, `UpdateParentCommand`, `GetParentsQuery`, `LinkStudentToParentCommand`, `ParentsController`. |
| FR-CRM-03 | Lifecycle tracking with timestamps + officer attribution | ⚠️ | `UpdateStudentStatusCommand` exists but doesn't log the transition. Add a `StudentStatusHistory` table or use the existing audit log to record from→to + userId + timestamp on every status change. |
| FR-CRM-04 | 360° student view | ⚠️ | `StudentDetailDto` already aggregates fees & attendance %. Missing: results history list, document list, communication log. Update `GetStudentByIdQueryHandler` to load these and update the frontend `StudentDetailPage.tsx` to use tabs (Overview / Attendance / Results / Fees / Documents / Communications). |
| FR-CRM-05 | Communication log | ❌ | New `Communication` entity (Id, StudentId, Channel: Sms/Email/InApp, Subject, Body, SentAt, SentByUserId, Status). Append on every notification dispatch. Expose `GetCommunicationsForStudentQuery`. |
| FR-CRM-06 | Segmentation/filtering (performance band, fee status) | ⚠️ | `GetStudentsQuery` supports search/class/status. Add filters: `feeStatus` (Pending/PartiallyPaid/Paid/Overdue), `attendanceBand` (<60, 60-75, 75-90, ≥90), `performanceBand` (A/B/C/D/F). |
| FR-CRM-07 | Document management | ❌ | New `StudentDocument` entity (Id, StudentId, DocumentType, FileName, StorageKey, UploadedAt, UploadedBy). Endpoints: `POST /students/{id}/documents` (multipart upload → MinIO), `GET /students/{id}/documents`, `DELETE /students/{id}/documents/{docId}`. |
| FR-CRM-08 | Inquiry management | ❌ | New `Inquiry` entity (Name, Phone, Email, Source, InquiredProgram, Status: New/Contacted/Converted/Dropped, FollowUpDate, AssignedToUserId). CRUD endpoints under `/inquiries`. |
| FR-CRM-09 | Family linkage | ⚠️ | `Student.ParentId` exists. Add `GetFamilyStudentsQuery(parentId)` returning all linked students. Use it on parent portal dashboard. |

**Acceptance:** `GET /students/{id}` returns 360-view with attendance%, fees, results, documents, communications. `GET /parents` lists parents. `GET /inquiries` lists inquiries. `POST /students/{id}/documents` uploads to MinIO.

---

## Module 7.2 — Admissions

| FR | Requirement | Status | Gap to close |
| --- | --- | --- | --- |
| FR-ADM-01 | Online application portal (public, no auth) | ⚠️ | `SubmitApplicationCommand` + handler exist behind `[Authorize]`. Add a public `[AllowAnonymous] POST /admissions/applications/public` endpoint with rate limiting + reCAPTCHA placeholder. |
| FR-ADM-02 | Pipeline funnel | ✅ | — |
| FR-ADM-03 | Merit list generation (PDF export) | ⚠️ | `GenerateMeritListCommand` returns data but no PDF. Add `GenerateMeritListPdfCommand` that calls `IPdfService` with a QuestPDF template; return `MinIO` storage key + signed URL. |
| FR-ADM-04 | Seat availability | ❌ | Add `MaxSeats` to `AcademicProgram` (per-class capacity already in `Section.MaxStudents`). New `GetSeatAvailabilityQuery(programId)` returning `{ programId, totalSeats, enrolled, available, waitlisted }`. |
| FR-ADM-05 | Offer letter generation | ⚠️ | `ReviewApplicationCommand` updates status. Add `GenerateOfferLetterCommand` (PDF via QuestPDF) + email dispatch via `EmailService`. |
| FR-ADM-06 | Enrollment-on-payment automation | ❌ | In `RecordPaymentCommand`, when payment is for an admission fee invoice AND application status = Accepted, auto-trigger `ConfirmEnrollmentCommand` (creates student record, deactivates application). |
| FR-ADM-07 | Transfer applications | ❌ | New `TransferRequest` entity (StudentId, FromCampusId, ToCampusId, Reason, Status, Approvals). Endpoints: `POST /transfers`, `POST /transfers/{id}/approve`. |
| FR-ADM-08 | Bulk import (CSV/Excel) | ❌ | `POST /admissions/bulk-import` accepting an `IFormFile`. Parse with ClosedXML (already a dep). Validate each row, surface errors per row, return a `BulkImportResult { totalRows, successCount, failures: [{rowNum, errors}] }`. |
| FR-ADM-09 | Admissions analytics (conversion funnel, campus trends) | ⚠️ | Current funnel only gives counts. Add `GetAdmissionsAnalyticsQuery` returning inquiry-to-application rate, application-to-enrollment rate, campus-wise trends over last 6 months. |

**Acceptance:** Public can POST application without auth. Bulk-import a CSV of 100 applicants and see a row-level result report. Merit list downloads as PDF.

---

## Module 7.3 — Procurement & Vendor

| FR | Requirement | Status | Gap to close |
| --- | --- | --- | --- |
| FR-PRC-01 | Vendor registry | ✅ | — (CreateVendor, GetVendors exist) |
| FR-PRC-02 | Requisition multi-level approval (HOD → Principal → Finance) | ⚠️ | `ReviewPurchaseRequisitionCommand` exists but single-stage. Add `PurchaseRequisition.ApprovalStage` enum + `ApprovalRecord` value object; the existing review command should route to the next stage based on value thresholds. |
| FR-PRC-03 | PO management | ✅ | — |
| FR-PRC-04 | Goods Receipt with PO match | ✅ | — |
| FR-PRC-05 | Three-way match (PO + GRN + Invoice) | ❌ | New `VendorInvoice` entity + `ProcessVendorInvoiceCommand` that validates qty/price against PO and GRN. |
| FR-PRC-06 | Budget integration | ❌ | New `DepartmentBudget` entity per campus per fiscal year. Before requisition approval, check `Spent + RequisitionTotal ≤ Budget`. |
| FR-PRC-07 | Vendor scorecard | ❌ | New `VendorPerformance` view (on-time delivery, quality, invoice accuracy) computed from GRN deviation + invoice match status. |
| FR-PRC-08 | Contract management | ❌ | New `VendorContract` entity (VendorId, StartDate, EndDate, Terms, Documents). Hangfire job for expiry alerts 30 days out. |
| FR-PRC-09 | Procurement analytics | ⚠️ | Add `GetProcurementAnalyticsQuery` — spend by category/vendor/campus, supplier concentration risk. |

---

## Module 7.4 — Academic Operations

### 7.4.1 Timetable

| FR | Requirement | Status | Gap to close |
| --- | --- | --- | --- |
| FR-TT-01 | Auto generation | ❌ | `CreateTimetableCommand` is manual. Add `AutoGenerateTimetableCommand` that takes (sectionId, termName) and constraints (teacher availability + subject load) and produces slots greedily, then runs conflict checks. |
| FR-TT-02 | Conflict detection | ✅ | — (handler line 20-70 covers section-overlap, teacher double-booking, and existing-slot conflicts) |
| FR-TT-03 | Substitute teacher assignment | ❌ | New `SubstituteAssignment` entity (TimetableSlotId, OriginalTeacherId, SubTeacherId, Date, Reason). `POST /timetable/substitutes` + auto-notify affected students/parents. |
| FR-TT-04 | Publishing | ⚠️ | Add `IsPublished` + `PublishedAt` to `TimetableSlot`. Add `PublishTimetableCommand(sectionId, termName)`. Filter `GetTimetableQuery` for students/parents to published only. |
| FR-TT-05 | Term + holiday calendar | ❌ | New `AcademicTerm` entity (Name, CampusId, StartDate, EndDate, IsActive) + `Holiday` entity (TermId, Date, Description). Timetable generator must skip holidays. |

### 7.4.2 Attendance

| FR | Status | Gap |
| --- | --- | --- |
| FR-ATT-01 Tablet UI | ✅ | — |
| FR-ATT-02 Real-time sync | ✅ | — |
| FR-ATT-03 Staff attendance | ⚠️ | `Attendance.StaffId` exists. Add `MarkStaffAttendanceCommand` + `/api/hrm/attendance` endpoint + UI under HRM portal. |
| FR-ATT-04 Absence alerts (SMS) | ❌ | In `MarkAttendanceCommandHandler`, after save, for any `isPresent=false`, enqueue a Hangfire job calling `ISmsService.SendAsync(parentPhone, message)`. Append to `Communication` log (FR-CRM-05). |
| FR-ATT-05 Analytics (daily/weekly/monthly) | ⚠️ | Extend `GetAttendanceReportQuery` to accept granularity (Day/Week/Month) and produce time-series data. |
| FR-ATT-06 Leave workflow (student) | ❌ | Currently only staff Leave entity supports application. Add `StudentLeave` entity + `ApplyStudentLeaveCommand` + approval. |
| FR-ATT-07 Attendance-based eligibility | ❌ | New `GetExamEligibilityQuery(termId, sectionId)` returning students whose attendance % is below configured threshold (default 75). Used by `GenerateAdmitCardsCommand` to skip ineligible students. |

### 7.4.3 Examinations

| FR | Status | Gap |
| --- | --- | --- |
| FR-EXM-01 Scheduling | ✅ | — |
| FR-EXM-02 Admit card generation | ⚠️ | `GenerateAdmitCardsCommand` exists. Wire to `IPdfService` (QuestPDF template) + push to MinIO; expose `GET /examinations/{examId}/admit-card/{studentId}.pdf` (student-portal-facing). Enforce FR-ATT-07 eligibility. |
| FR-EXM-03 Seating plan | ❌ | New `SeatingPlan` entity + `GenerateSeatingPlanCommand` that assigns students to halls/rows based on enrollment + hall capacity. |
| FR-EXM-04 Invigilator assignment | ❌ | New `InvigilatorAssignment` entity. Check against the invigilator's own teaching subject for conflict-of-interest. |
| FR-EXM-05 Answer script tracking | ❌ | New `AnswerScriptBundle` entity (ExamScheduleItemId, ScriptCount, IssuedToTeacher, ReturnedAt, Status). |
| FR-EXM-06 Exam fee integration | ❌ | When `CreateExamScheduleCommand` runs, if exam has a fee, auto-generate a fee invoice line item for each enrolled student. |

---

## Module 7.5 — Results & Reporting

| FR | Status | Gap |
| --- | --- | --- |
| FR-RES-01 Marks entry | ✅ | — |
| FR-RES-02 Configurable grading | ⚠️ | New `GradingScale` entity (Name, Rules: List<{minPct, maxPct, grade, gpaPoint}>). Per-program assignment. `EnterMarksCommandHandler` should look up the scale and compute grade dynamically. |
| FR-RES-03 Auto computation | ⚠️ | Once FR-RES-02 has scales, ensure pass/fail/division/aggregate are computed from total obtained / total max per the scale. |
| FR-RES-04 Grade card PDF | ❌ | New `GenerateGradeCardCommand(studentId, termId)` calling `IPdfService` with a QuestPDF template. Store in MinIO; expose download endpoint. |
| FR-RES-05 Publishing workflow (Teacher → Coordinator → Principal) | ⚠️ | Add `Result.ApprovalStage` (TeacherSubmitted, CoordinatorVerified, PrincipalApproved, Published). `PublishResultsCommand` should only advance one stage at a time; bake role check into authorize policy. |
| FR-RES-06 Longitudinal progress | ❌ | New `GetStudentProgressQuery(studentId)` returning per-term GPAs + chart data. |
| FR-RES-07 Rank computation | ❌ | New `ComputeRanksCommand(sectionId, termId)` writing rank-in-section + rank-in-class onto `Result` rows after publishing. |
| FR-RES-08 Cross-campus analytics | ⚠️ | Extend `GetResultsAnalyticsQuery` to optionally take `campusId=null` (system admin) and aggregate across all campuses. |
| FR-RES-09 At-risk students | ❌ | New `GetAtRiskStudentsQuery` returning students with attendance < 75% OR average marks < passing threshold. |
| FR-RES-10 Result notifications | ❌ | On `PublishResultsCommand` completing publish stage, enqueue Hangfire job dispatching SMS/email/in-app to student + parent. |

---

## Module 7.6 — Finance

### Fee Management

| FR | Status | Gap |
| --- | --- | --- |
| FR-FEE-01 Fee structure config | ❌ | New `FeeStructure` entity (CampusId, ProgramId, TermName, FeeHeads: List<{name, amount, dueDayOfMonth}>). `GenerateInvoicesCommand` should read from this instead of computing from i%3 demo logic. |
| FR-FEE-02 Auto invoice generation | ✅ | — (works, but needs to consume FR-FEE-01 once added) |
| FR-FEE-03 Multi-channel payment | ⚠️ | Add `PaymentMethod` enum (Cash, BankTransfer, JazzCash, Easypaisa, Card). Add `JazzCashGatewayService : IPaymentGateway` (stub for sandbox). `RecordPaymentCommand` accepts the channel. |
| FR-FEE-04 Digital receipt PDF | ❌ | After `RecordPaymentCommand`, generate a receipt PDF via QuestPDF + push to MinIO + email link to student/parent. |
| FR-FEE-05 Defaulter escalation (reminder → late fee → access restriction) | ⚠️ | `ApplyLateFeeCommand` exists. Add Hangfire recurring job: T+1 reminder SMS, T+7 apply late fee, T+30 set `Student.IsPortalLocked = true`. |
| FR-FEE-06 Concession management | ❌ | New `FeeConcession` entity (StudentId, ConcessionType: Merit/Sibling/NeedBased, Percentage, ApprovedBy, AppliedAt). `ApplyConcessionCommand` reduces invoice total. |
| FR-FEE-07 Refunds | ❌ | New `FeeRefund` entity + `ProcessRefundCommand` with approval workflow. |
| FR-FEE-08 Fee analytics | ✅ | — |

### Payroll

| FR | Status | Gap |
| --- | --- | --- |
| FR-PAY-01 Salary components | ⚠️ | Replace `Staff.BasicSalary` with `SalaryComponent` collection (Basic, HouseAllowance, Medical, Conveyance, Tax, EOBI). Update `PayrollCalculator` to sum + apply Pakistani income tax slabs from a config table. |
| FR-PAY-02 Monthly processing | ✅ | — |
| FR-PAY-03 Payslip PDF | ❌ | `GeneratePayslipPdfCommand` (QuestPDF) + `GET /payroll/{payrollId}/payslip.pdf` (staff-portal-facing). |
| FR-PAY-04 Multi-stage approval (HR → Finance → Principal → Disburse) | ⚠️ | Add `Payroll.ApprovalStage` enum + step-by-step state machine. |
| FR-PAY-05 Tax + EOBI compliance | ⚠️ | `PayrollCalculator` needs the official 2026 tax slabs in a config or DB-backed lookup. |
| FR-PAY-06 Payroll analytics | ⚠️ | Add cost-center grouping (Department) + YoY comparison. |

---

## Module 7.7 — HRM

| FR | Status | Gap |
| --- | --- | --- |
| FR-HRM-01 Master records | ✅ | — |
| FR-HRM-02 Recruitment pipeline | ❌ | New `Vacancy` + `JobApplication` entities. Status: Posted/Reviewing/Shortlisted/Interview/Offered/Hired/Rejected. |
| FR-HRM-03 Contract management | ❌ | Add `EmploymentContract` entity (StaffId, Type: Permanent/Contract/Probation, StartDate, EndDate, RenewalDueDate). Hangfire alert 30 days before EndDate. |
| FR-HRM-04 Leave management | ✅ | — |
| FR-HRM-05 Staff attendance | ⚠️ | Cover-by FR-ATT-03 above. |
| FR-HRM-06 Performance management | ❌ | New `Appraisal` entity (StaffId, PeriodStart, PeriodEnd, SelfRating, ManagerRating, GoalsMet, Comments). Workflow: Staff submits self → Manager reviews → Principal approves. |
| FR-HRM-07 Training & development | ❌ | New `Training` entity + `StaffTraining` join (completion date, certificate URL). |
| FR-HRM-08 Disciplinary records | ❌ | New `DisciplinaryAction` entity (StaffId, Type: Warning/ShowCause/Suspension/Termination, IssuedBy, IssuedAt, Documents). |
| FR-HRM-09 Separation management | ❌ | New `Separation` entity + clearance checklist (asset return, password revocation, final settlement). |
| FR-HRM-10 Org chart | ❌ | New `Staff.ReportsTo` (nullable self-FK). `GetOrgChartQuery(campusId)` returning hierarchical tree. Frontend uses a tree-view component. |
| FR-HRM-11 HR analytics | ✅ | — |

---

## Module 7.8 — Assets & Inventory

| FR | Status | Gap |
| --- | --- | --- |
| FR-AST-01 Asset registry | ✅ | — |
| FR-AST-02 Lifecycle | ⚠️ | Add `AssetMaintenanceEvent` entity (AssetId, Date, Type, Cost, Notes). |
| FR-AST-03 Depreciation | ❌ | New `CalculateDepreciationCommand` running monthly via Hangfire, writing `AssetDepreciation` records (straight-line + reducing balance per asset config). |
| FR-AST-04 Allocation & transfer | ❌ | New `AssetAllocation` entity (AssetId, AllocatedTo: StaffId or DepartmentId, AllocatedAt, ReturnedAt). `TransferAssetCommand` for inter-campus moves. |
| FR-AST-05 Inventory stock | ❌ | New `InventoryItem` entity (separate from fixed Assets) + `StockLevel` per campus + `ReorderPoint`. Hangfire job: when level < reorder point, auto-create a `PurchaseRequisition`. |
| FR-AST-06 Stock issue/return | ❌ | New `StockTransaction` entity (Issue/Return) with department + requester. |
| FR-AST-07 Annual verification | ❌ | New `AssetVerificationCycle` entity + `AssetVerificationResult` per asset (found/missing/damaged). |
| FR-AST-08 Disposal | ❌ | New `AssetDisposal` entity + `DisposeAssetCommand` with approval. |
| FR-AST-09 Asset analytics | ❌ | `GetAssetAnalyticsQuery` — utilization, depreciation schedule, maintenance cost, campus-wise valuation. |

---

## Module 7.9 — Cross-Cutting Platform Features

| FR | Status | Gap |
| --- | --- | --- |
| FR-PLT-01 Real-time analytics dashboards | ⚠️ | Per-role dashboards exist as queries (`Principal`, `Executive`, `Teacher`, `Student`, `Parent`). Frontend currently renders only `principal`. Build the other four dashboard pages. Add PDF/Excel export buttons. |
| FR-PLT-02 AI Chatbot | ✅ | — (placeholder API key) |
| FR-PLT-03 Notifications engine (40+ events, SMS/email/in-app) | ❌ | New `NotificationEvent` enum + `NotificationDispatcher` service consuming MediatR `INotification` events. Channels: SMS (`ISmsService`), email (`IEmailService`), in-app (SignalR `NotificationHub`). All event handlers append to `Communication` log (FR-CRM-05). |
| FR-PLT-04 E-learning integration | ❌ | Bridge service `ILmsService` (`PushEnrollment`, `PullProgress`). Stub for now; concrete adapter when LMS is chosen. |
| FR-PLT-05 Document generation engine | ⚠️ | `IPdfService` exists. Build templates: GradeCard, FeeReceipt, OfferLetter, Payslip, PurchaseOrder, AdmitCard, AssetLabel. Each template lives in `FAMS.Infrastructure/Pdf/Templates/`. |
| FR-PLT-06 Multi-campus configuration | ⚠️ | All entities have `CampusId`. Need a `CampusSettings` entity per campus (academicCalendar, feeStructure, gradingScale, branding). UI under Super Admin portal. |
| FR-PLT-07 Audit trail viewer | ⚠️ | `AuditLog` table populated by Audit.NET. Need `GET /audit-logs` with filters (campus/user/action/date) and a UI page. |
| FR-PLT-08 RBAC | ✅ | — |
| FR-PLT-09 Bulk operations | ⚠️ | Bulk import students covered in FR-ADM-08. Add bulk fee invoice generation (already done), bulk leave grant, bulk attendance import. CSV export buttons on every list page. |
| FR-PLT-10 Offline attendance | ⚠️ | localStorage fallback exists. Upgrade to IndexedDB via `dexie` for proper offline queue + Background Sync API for auto-flush. Show pending-sync badge in header. |

---

## Cross-Cutting Architectural Gaps

### Portals & Roles
Currently a single `AppLayout` with the same nav for everyone. PRD requires distinct portals per role:

| Role | Portal | Status |
| --- | --- | --- |
| System Administrator | Super Admin Portal — all 31 campuses | ❌ |
| Executive / Board | Read-only KPI dashboard | ❌ |
| Principal | Campus Portal (single campus) | ⚠️ Current dashboard renders for everyone |
| Academic Coordinator | Subset of Campus Portal | ❌ |
| Teacher | Teacher Portal | ❌ |
| Accountant | Subset of Campus Portal (Finance + HRM-Payroll only) | ❌ |
| HR Officer | Subset of Campus Portal (HRM only) | ❌ |
| Procurement Officer | Subset of Campus Portal (Procurement + Assets only) | ❌ |
| Student | Student Portal | ❌ |
| Parent | Parent Portal | ❌ |

Work: role-based redirect on login + 4 layout shells (`SuperAdminLayout`, `CampusLayout`, `TeacherLayout`, `StudentLayout`) + per-portal nav configs + per-portal dashboards + parent portal pages.

### Campuses (31, not 3)
Current: 3 campuses seeded. PRD: 31 campuses. `DbSeeder.SeedCampusesAsync` should generate FC-01…FC-31 with realistic Pakistani city distribution. Add `IsMainCampus` bool to `Campus` if HQ-vs-sub distinction is desired.

### NFRs not yet addressed
- **NFR-09 MFA mandatory for admin/principal:** MFA scaffolding (`SetupMfaCommand`, `VerifyMfaCommand`) is wired but not enforced on login. Add `RequireMfaForRoles` check in `LoginCommandHandler`.
- **NFR-10 TLS 1.3:** Currently HTTP in dev. Production deployment must terminate TLS at the gateway with cert via Let's Encrypt / cloud cert.
- **NFR-11 Session timeout:** JWT expiry is configured (30 min). Add refresh-token rotation + idle-timeout detection on the frontend (auto-logout after configurable idle).
- **NFR-13 WCAG 2.1 AA:** Run `@axe-core/react` against every page. Fix contrast, missing labels, keyboard traps.
- **NFR-14 80% unit-test coverage:** Currently a few integration tests scaffolded, no real coverage. Add xUnit tests per handler.

### Database scaling (NFR-08)
- **Row-level security:** `infra/postgres/init.sql` has the `current_campus_id()` function but no `RLS` policies on tables. Add `ALTER TABLE … ENABLE ROW LEVEL SECURITY` and policies per tenant-scoped table.
- **Partitioning by `campus_id + academic_year`:** Apply once data volumes warrant it (>1M rows per table).

---

## Recommended Delivery Plan (sprints)

### Sprint A — Foundations (≈ 1 week)
1. Seed 31 campuses with realistic Pakistani city distribution.
2. Build role-based redirect on login + 4 portal shells (SuperAdmin / Campus / Teacher / Student).
3. Implement RLS policies on `students`, `staff`, `fee_invoices`, `attendances`, `applications`.
4. Acceptance: each role logs in and lands on the correct portal; data is correctly scoped to their campus.

### Sprint B — Document generation & notifications (≈ 1 week)
5. Build QuestPDF templates: GradeCard, FeeReceipt, OfferLetter, Payslip, AdmitCard.
6. Build `NotificationDispatcher` consuming MediatR `INotification` events; wire SMS/email/in-app channels.
7. Hook attendance-absence event → SMS to parent (FR-ATT-04).
8. Hook result-published event → SMS+email to student/parent (FR-RES-10).
9. Acceptance: marking an absence sends a real SMS (via Twilio sandbox); generating a payslip produces a downloadable PDF.

### Sprint C — Academic completeness (≈ 1.5 weeks)
10. Add `AcademicTerm` + `Holiday` entities (FR-TT-05).
11. Add `AutoGenerateTimetableCommand` (FR-TT-01).
12. Add `SubstituteAssignment` (FR-TT-03).
13. Add `SeatingPlan`, `InvigilatorAssignment`, `AnswerScriptBundle` (FR-EXM-03/04/05).
14. Add student-leave workflow (FR-ATT-06).
15. Add exam eligibility check (FR-ATT-07) + enforce on admit-card generation.
16. Acceptance: a coordinator generates a timetable for Class 9 Spring 2026 with zero conflicts; generates seating + invigilators for an exam; ineligible students don't receive admit cards.

### Sprint D — Finance completeness (≈ 1 week)
17. Add `FeeStructure` + `FeeConcession` + `FeeRefund` entities (FR-FEE-01/06/07).
18. Wire JazzCash sandbox via `IPaymentGateway` (FR-FEE-03).
19. Defaulter escalation Hangfire jobs (FR-FEE-05).
20. Multi-component salary + PK tax slab lookup (FR-PAY-01/05).
21. Payroll multi-stage approval (FR-PAY-04).
22. Acceptance: a parent pays online via JazzCash sandbox → receipt is emailed; running payroll for May produces compliant payslips with tax & EOBI lines.

### Sprint E — HRM + Assets completeness (≈ 1.5 weeks)
23. `Vacancy`, `JobApplication`, recruitment pipeline (FR-HRM-02).
24. `EmploymentContract` + renewal alerts (FR-HRM-03).
25. `Appraisal`, `Training`, `DisciplinaryAction`, `Separation` (FR-HRM-06/07/08/09).
26. Org chart query + UI (FR-HRM-10).
27. `InventoryItem`, `StockLevel`, `StockTransaction` (FR-AST-05/06).
28. Depreciation Hangfire job (FR-AST-03).
29. Asset allocation/transfer/disposal (FR-AST-04/08).
30. Acceptance: org chart renders 31-campus hierarchy; reorder-point breach auto-creates a requisition; assets depreciate monthly.

### Sprint F — Cross-cutting polish (≈ 1 week)
31. Audit log viewer UI (FR-PLT-07).
32. Bulk import endpoints + CSV export buttons (FR-PLT-09).
33. IndexedDB offline queue via dexie (FR-PLT-10).
34. Communication log everywhere (FR-CRM-05).
35. Student documents upload to MinIO (FR-CRM-07).
36. Inquiry CRUD (FR-CRM-08).
37. WCAG sweep + axe-core fixes (NFR-13).
38. Unit tests to 80% coverage on Application layer (NFR-14).

### Sprint G — Hardening (≈ 0.5 week)
39. MFA enforcement for SystemAdmin/Principal (NFR-09).
40. Idle-timeout auto-logout (NFR-11).
41. Penetration scan + OWASP top-10 review.
42. Load test for NFR-01/02 (5,000 concurrent, p95 < 500 ms).

---

## How to use this prompt

Hand any single sprint (or any single FR row) back as a follow-up message and I'll execute it. Recommended order:

1. **Sprint A** first — it unblocks every per-role feature.
2. Then **Sprint B** — notifications + PDFs are dependencies for many FRs in C/D.
3. **C / D / E** can be done in any order or in parallel.
4. **F + G** are polish/hardening; leave for last.

Each sprint is sized for one full engineering week. The whole gap is ≈ 7–8 weeks of focused work.

---

## Verification per sprint

After every sprint, the following must remain green:

```
dotnet build D:\FAMS\src\FAMS\FAMS.slnx      # 0 errors, 0 warnings
cd D:\FAMS\src\FAMS\frontend && npx tsc --noEmit   # 0 errors
docker compose -f D:\FAMS\src\FAMS\docker-compose.yml ps   # all containers up + healthy
curl http://localhost:5000/health             # {"status":"healthy"}
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" \
     -d '{"email":"admin@fams.local","password":"Admin@12345!"}'   # 200, JWT
```

Plus the sprint-specific acceptance criteria listed above.
