# FAMS — Master PRD Compliance Audit Prompt
## Full System vs PRD Verification — Paste into Claude Code

---

You are a senior software quality assurance engineer and .NET + React architect.

Your job is to perform a **complete PRD compliance audit** of the FAMS system.

Read the PRD first — it is the ground truth for everything:
`D:\FAMS\src\FAMS\docs\FAMS PRD VERSION 1.pdf`

Then audit the live system at `D:\FAMS\src\FAMS` against every single requirement in that document.

Do NOT skip anything. Every FR, NFR, architecture decision, security requirement, integration, and user role defined in the PRD must be checked.

---

# ═══════════════════════════════════════════
# AUDIT SECTION 1 — SYSTEM OVERVIEW (PRD §5)
# ═══════════════════════════════════════════

Check the PRD §5 system overview table and verify each technology is present and correctly implemented:

## 1.1 Presentation Layer
- [ ] React.js SPA — is the frontend built in React? Check `frontend/package.json`
- [ ] PWA (Progressive Web App) — does `frontend/` have a service worker? Check for `vite-plugin-pwa` or `workbox` in package.json and a `sw.ts` or `service-worker.ts` file
- [ ] Responsive design — does `tailwind.config.*` exist? Does `src/index.css` have @tailwind directives?
- [ ] Role-based UI — does App.tsx have separate routes for each of the 10 roles?
- [ ] JWT authentication on all API calls — does `axiosClient.ts` inject Authorization header?

## 1.2 API Gateway Layer
- [ ] Centralized gateway — does `FAMS.Gateway` project exist with YARP configured?
- [ ] JWT validation at gateway — does gateway `appsettings.json` have JWT config?
- [ ] Rate limiting — is rate limiting middleware present in gateway or API?
- [ ] Versioned API (v1) — do all controllers use `[Route("api/v1/[controller]")]`?

## 1.3 Application Layer
- [ ] ASP.NET Core 8 — does `FAMS.API.csproj` target `net8.0`?
- [ ] Clean Architecture — do folders `FAMS.Domain`, `FAMS.Application`, `FAMS.Infrastructure`, `FAMS.API` all exist?
- [ ] CQRS with MediatR — does `FAMS.Application.csproj` reference `MediatR`?
- [ ] AI Chatbot — does `AiChatbotService.cs` exist? Does it call Anthropic API?
- [ ] Notifications service — does `Hangfire` exist for async notifications? Is `ISmsService`, `IEmailService` implemented?
- [ ] SignalR — is SignalR registered in `Program.cs` and is `NotificationHub.cs` present?

## 1.4 Data Layer
- [ ] PostgreSQL — does `FAMS.Infrastructure.csproj` reference `Npgsql.EntityFrameworkCore.PostgreSQL`?
- [ ] Row-level security — does `FamsDbContext.cs` apply campus_id filters?
- [ ] Redis — is `StackExchange.Redis` referenced? Is it registered in `DependencyInjection.cs`?
- [ ] S3-compatible storage (MinIO) — is `AWSSDK.S3` or MinIO SDK referenced? Is `StorageService.cs` present?
- [ ] File storage for documents, PDFs, exports — does `IStorageService` interface exist with Upload/Download methods?

## 1.5 Infrastructure Layer
- [ ] Docker — does `docker-compose.yml` exist at solution root?
- [ ] All required services in docker-compose: postgres, redis, minio, seq, prometheus, grafana?
- [ ] Multi-stage Dockerfiles for API and frontend?

## 1.6 External Integrations
- [ ] Payment gateway integration — is JazzCash or Easypaisa configured in appsettings?
- [ ] SMS gateway — is Twilio or Jazz SMS configured?
- [ ] Email service — is MailKit/SMTP configured?
- [ ] LMS bridge — is there any LMS SSO integration stub?

For each item: state PRESENT ✅ or MISSING ❌ and the exact file path if present.

---

# ═══════════════════════════════════════════
# AUDIT SECTION 2 — USER ROLES (PRD §6)
# ═══════════════════════════════════════════

PRD defines exactly 10 roles. Verify each is implemented:

| Role | Check in DB seed | Check in JWT claims | Check in frontend routing | Check in RBAC policies |
|------|-----------------|--------------------|--------------------------|-----------------------|

Roles to check:
1. SystemAdmin — full access all campuses
2. Executive / Board — read-only KPI dashboards, all campuses
3. Principal — full access, single campus
4. AcademicCoordinator — timetable, exams, results, attendance
5. Teacher — attendance marking, marks entry, own students
6. Accountant — fee management, payroll, financial reports
7. HrOfficer — staff profiles, leave, HR reports
8. Student — self-service portal, own data only
9. Parent — child's data only, read-only
10. ProcurementOfficer — requisitions, POs, vendors

For each role check:
- Is it seeded in `DbSeeder.cs`?
- Is there a policy in `Program.cs`?
- Is there a protected route in `App.tsx`?
- Is there a portal layout component?
- Does the portal show only role-appropriate data?

Report: COMPLETE ✅ / PARTIAL ⚠️ / MISSING ❌ for each role.

---

# ═══════════════════════════════════════════
# AUDIT SECTION 3 — FUNCTIONAL REQUIREMENTS
# ═══════════════════════════════════════════

Check EVERY functional requirement from PRD §7.
For each FR: verify backend handler exists + frontend page/component exists.

## 3.1 CRM — Student and Parent Management (FR-CRM-01 to FR-CRM-09)

| FR | Description | Backend Handler | Frontend Component | Status |
|----|-------------|-----------------|-------------------|--------|

Check each:
- FR-CRM-01: Student Profile Management
  Backend: `CreateStudentCommandHandler.cs`, `UpdateStudentCommandHandler.cs`
  Frontend: `StudentsPage.tsx`, `StudentDetailPage.tsx`, Add Student form
  
- FR-CRM-02: Parent/Guardian Profiles
  Backend: Parent entity in `FamsDbContext.cs`, Parent CRUD handlers
  Frontend: Parent profile view in StudentDetailPage tabs
  
- FR-CRM-03: Student Lifecycle Tracking (Prospect→Applicant→Enrolled→Active→Graduated/Withdrawn)
  Backend: `UpdateStudentStatusCommandHandler.cs`, StudentStatus enum with all 7 values
  Frontend: Status badge on student list, status change dropdown
  
- FR-CRM-04: 360-Degree Student View
  Backend: `GetStudentByIdQueryHandler.cs` returns: attendance%, fee status, results, behavioral notes
  Frontend: `StudentDetailPage.tsx` with tabs: Overview, Attendance, Results, Fees, Documents
  
- FR-CRM-05: Communication Log
  Backend: CommunicationLog entity, log entries created when SMS/email sent
  Frontend: Communications tab in StudentDetailPage
  
- FR-CRM-06: Segmentation and Filtering
  Backend: `GetStudentsQueryHandler.cs` supports filter by campus, class, performance band, fee status
  Frontend: Filter dropdowns on StudentsPage
  
- FR-CRM-07: Document Management
  Backend: Document upload via `IStorageService`, document list per student
  Frontend: Documents tab in StudentDetailPage with upload button
  
- FR-CRM-08: Inquiry Management
  Backend: Inquiry entity and handlers, inquiry-to-application pipeline
  Frontend: Inquiries section in Admissions module
  
- FR-CRM-09: Family Linkage
  Backend: Parent→Student many-to-many, `LinkStudentToParentCommand`
  Frontend: Family members shown on student profile

## 3.2 Admissions (FR-ADM-01 to FR-ADM-09)

- FR-ADM-01: Online Application Portal (PUBLIC — no login required)
  Backend: `SubmitApplicationCommand` with `[AllowAnonymous]` endpoint
  Frontend: Public page at `/apply` accessible without login
  
- FR-ADM-02: Application Pipeline Dashboard
  Backend: `GetAdmissionsFunnelQuery` returns counts for each stage
  Frontend: Funnel/Kanban view with stage columns: Inquiry, Applied, Under Review, Offered, Enrolled, Declined
  
- FR-ADM-03: Merit List Generation
  Backend: `GenerateMeritListCommand`, sorts by marks+entry test, applies quotas, exports PDF
  Frontend: Generate Merit List button, downloadable PDF
  
- FR-ADM-04: Seat Availability Management
  Backend: Seat count per section, waitlist logic
  Frontend: Seat availability shown on admissions dashboard
  
- FR-ADM-05: Offer Letter Generation
  Backend: `GenerateOfferLetterCommand`, calls `IPdfService`, emails via `IEmailService`
  Frontend: "Send Offer Letter" button on application detail
  
- FR-ADM-06: Enrollment Confirmation
  Backend: Enrollment triggers: Student record creation + portal credentials + first fee invoice
  Frontend: "Confirm Enrollment" button, triggers DF-INT-01 and DF-INT-02
  
- FR-ADM-07: Transfer Applications
  Backend: Inter-campus transfer request entity and approval workflow
  Frontend: Transfer request form and approval view
  
- FR-ADM-08: Bulk Import
  Backend: CSV/Excel import endpoint, uses ClosedXML, `BulkImportStudentsCommand`
  Frontend: Upload CSV button with template download
  
- FR-ADM-09: Admissions Analytics
  Backend: Conversion rates: inquiry→application, application→enrollment, campus-wise
  Frontend: Analytics charts in Admissions dashboard

## 3.3 Procurement (FR-PRC-01 to FR-PRC-09)

- FR-PRC-01: Vendor Registry — vendor CRUD, categories, ratings
- FR-PRC-02: Purchase Requisition — multi-level approval HOD→Principal→Finance
- FR-PRC-03: Purchase Order Management — auto-generate from approved requisition
- FR-PRC-04: Goods Receipt Note (GRN) — delivery confirmation, quantity match
- FR-PRC-05: Vendor Invoice Processing — 3-way match PO+GRN+Invoice
- FR-PRC-06: Budget Integration — real-time budget check before approval
- FR-PRC-07: Vendor Performance Tracking — scorecard
- FR-PRC-08: Contract Management — expiry alerts
- FR-PRC-09: Procurement Analytics — spend by campus/category/vendor

For each: Backend handler exists? ✅/❌ | Frontend page exists? ✅/❌

## 3.4 Academic Operations — Timetable (FR-TT-01 to FR-TT-05)

- FR-TT-01: Automated Timetable Generation
  Backend: `CreateTimetableCommand` with conflict detection logic
  Frontend: Timetable creation wizard or form
  
- FR-TT-02: Conflict Detection
  Backend: Validates no teacher double-booking, no room conflict before saving
  Frontend: Shows conflict errors inline
  
- FR-TT-03: Substitute Teacher Assignment
  Backend: `AssignSubstituteCommand`, notifies students
  Frontend: Substitute assignment button per timetable slot
  
- FR-TT-04: Timetable Publishing
  Backend: Publish command, makes timetable visible to teacher+student portals
  Frontend: Published timetable view on teacher portal and student portal
  
- FR-TT-05: Session Scheduling
  Backend: Academic calendar with term start/end, holidays, exam period blocking
  Frontend: Calendar configuration in admin

## 3.5 Academic Operations — Attendance (FR-ATT-01 to FR-ATT-07)

- FR-ATT-01: Tablet-Based Attendance Capture
  Frontend: `AttendancePage.tsx` — tablet-optimized, large touch targets (min 48px)
  
- FR-ATT-02: Real-Time Attendance Sync
  Backend: Attendance saved immediately, visible to parents/admins in real-time via SignalR
  
- FR-ATT-03: Staff Attendance Tracking
  Backend: Staff check-in/check-out endpoint, late flagging
  Frontend: Staff attendance section in HRM
  
- FR-ATT-04: Absence Alerts
  Backend: On absent record saved → `ISmsService.SendAsync()` to parent phone
  
- FR-ATT-05: Attendance Analytics
  Backend: Reports by student/class/section/subject/campus
  Frontend: Analytics charts with date range filter
  
- FR-ATT-06: Leave Application Workflow
  Backend: Student leave request, teacher/principal approval
  Frontend: Leave request form in student portal
  
- FR-ATT-07: Attendance-Based Eligibility
  Backend: Configurable threshold (default 75%), auto-flag ineligible students
  Frontend: Eligibility status shown on student attendance page

## 3.6 Academic Operations — Examinations (FR-EXM-01 to FR-EXM-06)

- FR-EXM-01: Examination Scheduling — exam timetable by term/subject/section
- FR-EXM-02: Admit Card Generation — eligibility check before generation, PDF via IPdfService
- FR-EXM-03: Seating Plan Management — auto-generate from enrollment + hall capacity
- FR-EXM-04: Invigilator Assignment — conflict-of-interest check against teaching assignments
- FR-EXM-05: Answer Script Tracking — collection→marking→return tracking
- FR-EXM-06: Examination Fee Management — integrated with Finance module

## 3.7 Results and Reporting (FR-RES-01 to FR-RES-10)

- FR-RES-01: Marks Entry Interface — teacher marks entry by subject + assessment type
- FR-RES-02: Configurable Grading System — percentage, GPA, custom scales
- FR-RES-03: Automated Result Computation — final grades, aggregate, division, pass/fail
- FR-RES-04: Grade Card Generation — PDF via IPdfService, available on student+parent portal
- FR-RES-05: Result Publishing Workflow — Teacher→Coordinator→Principal→Published
- FR-RES-06: Academic Progress Tracking — longitudinal, multiple terms
- FR-RES-07: Class/Section Rank Computation — auto-rank by aggregate
- FR-RES-08: Institutional Performance Reports — cross-campus analytics
- FR-RES-09: At-Risk Student Reports — below passing threshold identification
- FR-RES-10: Result Notifications — SMS/email to parents and students on publish

## 3.8 Finance — Fee Management (FR-FEE-01 to FR-FEE-08)

- FR-FEE-01: Fee Structure Configuration — fee heads, amounts, due dates, discounts per campus/program/term
- FR-FEE-02: Automated Invoice Generation — bulk generation for all enrolled students
- FR-FEE-03: Multi-Channel Payment — bank transfer, online gateway, cash
- FR-FEE-04: Digital Receipt Issuance — PDF receipt auto-generated on payment
- FR-FEE-05: Defaulter Management — reminder→late fee→access restriction escalation
- FR-FEE-06: Concession and Scholarship Management — merit/sibling/need-based
- FR-FEE-07: Fee Refund Processing — approval workflow + bank transfer
- FR-FEE-08: Fee Collection Analytics — daily/monthly/annual dashboards

## 3.9 Finance — Payroll (FR-PAY-01 to FR-PAY-06)

- FR-PAY-01: Employee Payroll Setup — salary components per grade (basic, allowances, EOBI, tax)
- FR-PAY-02: Monthly Payroll Processing — attendance deductions, leave adjustments
- FR-PAY-03: Payslip Generation — PDF via IPdfService, delivered to employee portal
- FR-PAY-04: Payroll Approval Workflow — HR→Finance→Principal→Disbursement
- FR-PAY-05: Tax and Statutory Compliance — Pakistani income tax slabs + EOBI (1%+5%)
- FR-PAY-06: Payroll Analytics — cost center analysis, headcount trends

## 3.10 HRM (FR-HRM-01 to FR-HRM-11)

- FR-HRM-01: Employee Master Records — digital personnel files
- FR-HRM-02: Recruitment Pipeline — vacancy→application→interview→offer→onboard
- FR-HRM-03: Contract Management — probation, confirmation, expiry alerts
- FR-HRM-04: Leave Management — annual/casual/medical/maternity, balance tracking
- FR-HRM-05: Staff Attendance Tracking — daily with late/early flagging, payroll integration
- FR-HRM-06: Performance Management — annual appraisal, self-assessment, HOD review
- FR-HRM-07: Training and Development — certifications log
- FR-HRM-08: Disciplinary Record Management — warnings, show-cause notices
- FR-HRM-09: Separation Management — clearance checklist, final settlement
- FR-HRM-10: Organizational Chart — live auto-generated hierarchy
- FR-HRM-11: HR Analytics — headcount, turnover, leave utilization

## 3.11 Assets and Inventory (FR-AST-01 to FR-AST-09)

- FR-AST-01: Asset Registry — unique tags, custodian, acquisition details
- FR-AST-02: Asset Lifecycle Management — Active/Maintenance/Condemned/Disposed
- FR-AST-03: Depreciation Tracking — straight-line + reducing balance
- FR-AST-04: Asset Allocation and Transfer — custody chain between campuses
- FR-AST-05: Inventory Stock Management — reorder alerts triggering procurement
- FR-AST-06: Stock Issue and Return — issue vouchers + return receipts
- FR-AST-07: Annual Asset Verification — physical count reconciliation
- FR-AST-08: Disposal Management — write-off approval workflow
- FR-AST-09: Asset Analytics — depreciation schedules, maintenance costs

## 3.12 Cross-Cutting Platform Features (FR-PLT-01 to FR-PLT-10)

- FR-PLT-01: Real-Time Analytics Dashboards
  Check: KPI tiles, line charts, bar charts, pie charts, heat maps on all role dashboards
  Check: PDF export button and Excel export button on dashboards
  
- FR-PLT-02: AI Chatbot
  Check: `AiChatbotService.cs` calls Anthropic API
  Check: `ChatbotController.cs` has POST endpoint
  Check: `ChatbotWidget.tsx` floating button visible on all portals
  Check: Chatbot handles: fee balance, exam schedule, results, timetable queries
  
- FR-PLT-03: Notifications Engine
  Check: 40+ trigger events defined
  Check: `ISmsService` called for: absence, fee overdue, result published, exam reminder
  Check: `IEmailService` called for: offer letter, receipt, payslip, result
  Check: In-app SignalR notifications shown in notification bell
  
- FR-PLT-04: E-Learning Integration
  Check: LMS SSO bridge stub in `DependencyInjection.cs`
  Check: `/api/v1/lms/sync` endpoint exists
  
- FR-PLT-05: Document Generation Engine
  Check: `IPdfService` generates: grade cards, fee receipts, offer letters, payslips, POs
  Check: `QuestPDF` referenced in `FAMS.API.csproj`
  Check: PDF download buttons present on: student results, fee invoices, payroll
  
- FR-PLT-06: Multi-Campus Configuration
  Check: Academic calendars per campus configurable
  Check: Fee structures per campus configurable
  Check: Grading scales per campus/program configurable
  
- FR-PLT-07: Audit Trail and Activity Logging
  Check: `Audit.NET` referenced in csproj
  Check: Every CRUD operation logged with: entityName, action, userId, IP, timestamp
  Check: Audit log viewer in Super Admin portal with filters
  Check: 5-year retention policy
  
- FR-PLT-08: Role-Based Access Control
  Check: Every API endpoint has `[Authorize(Policy="...")]`
  Check: Campus-scoped data (student can only see own campus data)
  Check: 10 distinct authorization policies in Program.cs
  
- FR-PLT-09: Bulk Operations
  Check: CSV import for students (FR-ADM-08)
  Check: Excel export for reports (attendance, fee, payroll)
  Check: Bulk marks entry via template
  
- FR-PLT-10: Offline-Capable Attendance
  Check: Service worker registered for attendance PWA
  Check: IndexedDB (Dexie.js) used for offline storage
  Check: Background sync on reconnection
  Check: Offline banner shown when navigator.onLine === false

---

# ═══════════════════════════════════════════
# AUDIT SECTION 4 — NON-FUNCTIONAL REQUIREMENTS (PRD §8)
# ═══════════════════════════════════════════

Check every NFR from PRD §8:

## NFR-01: Performance — Page load < 2s, API p95 < 500ms
- [ ] Is Vite used for frontend bundling (faster than CRA)?
- [ ] Is Redis caching used in hot-read endpoints (students list, dashboard)?
- [ ] Are API responses using `.AsNoTracking()` for read-only queries in EF Core?
- [ ] Is pagination implemented on all list endpoints (default page size 20)?

## NFR-02: Performance — 5,000 concurrent sessions
- [ ] Is ASP.NET Core Kestrel configured (not IIS) for async performance?
- [ ] Is Redis used for session storage (not in-memory)?
- [ ] Is the API stateless (JWT, no server-side sessions)?

## NFR-03: Availability — 99.9% uptime
- [ ] Does docker-compose have `restart: unless-stopped` on all services?
- [ ] Are health checks configured (`/health` endpoint)?
- [ ] Is Prometheus + Grafana set up for uptime monitoring?

## NFR-05: Reliability — Daily backups, 90-day retention
- [ ] Is `pg_dump` scheduled in Docker or a cron job?
- [ ] Is backup retention configured?

## NFR-09: Security — MFA mandatory for SystemAdmin and Principal
- [ ] Is TOTP MFA implemented in `ApplicationUser.cs` (ASP.NET Core Identity)?
- [ ] Is MFA enforced on login for SystemAdmin and Principal roles?
- [ ] Is there a setup MFA endpoint and verify MFA endpoint?

## NFR-10: Security — AES-256 at rest, TLS 1.3 in transit
- [ ] Is HTTPS configured (`app.UseHttpsRedirection()`)?
- [ ] Is MinIO configured with server-side encryption?
- [ ] Are passwords hashed with Identity's PasswordHasher (bcrypt)?
- [ ] Is no PII stored in plaintext anywhere?

## NFR-11: Security — Session timeouts
- [ ] JWT access token: 30 minutes for staff?
- [ ] JWT: 60 minutes for student/parent?
- [ ] Is idle timeout configured in frontend (auto-logout)?

## NFR-12: Usability — Browser compatibility, responsive ≥ 768px
- [ ] Is Tailwind CSS responsive utility used (md:, lg: prefixes)?
- [ ] Are all pages tested at 768px breakpoint?

## NFR-13: Usability — WCAG 2.1 Level AA
- [ ] Do all buttons have `aria-label` attributes?
- [ ] Do all form inputs have `<label>` elements?
- [ ] Is color contrast sufficient (4.5:1 ratio for normal text)?
- [ ] Is keyboard navigation supported?

## NFR-14: Maintainability — 80% unit test coverage, zero-downtime CI/CD
- [ ] Do `FAMS.UnitTests` and `FAMS.IntegrationTests` projects exist?
- [ ] Does `.github/workflows/ci.yml` exist?
- [ ] Are there at least 10 unit tests?

## NFR-16: Audit — 5-year log retention
- [ ] Is `Audit.NET` configured with PostgreSQL sink?
- [ ] Is there a log retention policy?
- [ ] Are audit logs immutable (append-only table)?

---

# ═══════════════════════════════════════════
# AUDIT SECTION 5 — SYSTEM ARCHITECTURE (PRD §9)
# ═══════════════════════════════════════════

## 5.1 Presentation Layer (PRD §9.1)
- [ ] React.js SPA confirmed
- [ ] Role-based rendering (user only sees own modules)
- [ ] JWT with refresh token rotation
- [ ] PWA for tablet attendance

## 5.2 API Gateway (PRD §9.2)
- [ ] YARP configured as centralized gateway
- [ ] Versioned RESTful API (/api/v1/)
- [ ] All requests pass through gateway (port 8080)
- [ ] Rate limiting at gateway level

## 5.3 Application Layer (PRD §9.3)
- [ ] 8 domain modules in Application layer
- [ ] Shared services: notifications, document generation, AI chatbot, analytics
- [ ] CQRS pattern with MediatR
- [ ] Async event-driven notifications via Hangfire

## 5.4 Data Layer (PRD §9.4)
- [ ] PostgreSQL with RLS (campus_id discriminator on all tables)
- [ ] Redis for sessions and hot data
- [ ] S3-compatible file storage (MinIO locally)
- [ ] EF Core migrations applied

## 5.5 Infrastructure Layer (PRD §9.5)
- [ ] Docker containers for all services
- [ ] docker-compose.yml with all 10 services
- [ ] Prometheus metrics at /metrics
- [ ] Grafana dashboards configured

---

# ═══════════════════════════════════════════
# AUDIT SECTION 6 — DATA FLOWS (PRD §10)
# ═══════════════════════════════════════════

Verify each internal data flow is implemented:

- DF-INT-01: Admissions→CRM: enrollment confirmation creates student profile + portal credentials
  Check: `ReviewApplicationCommandHandler` calls student creation on enrollment
  
- DF-INT-02: Admissions→Finance: enrollment triggers fee account + first invoice
  Check: After student created, `GenerateInvoicesCommand` called for first term
  
- DF-INT-03: Attendance→Results: attendance feeds exam eligibility
  Check: `GetAttendanceReportQuery` returns eligibility flag
  Check: Admit card generation checks attendance threshold
  
- DF-INT-04: Attendance→Finance: leave feeds payroll deductions
  Check: `ProcessPayrollCommandHandler` fetches approved leaves for deductions
  
- DF-INT-05: HR→Finance: staff profiles feed payroll
  Check: `ProcessPayrollCommandHandler` reads Staff.BasicSalary and allowances
  
- DF-INT-06: Procurement→Finance: approved invoices create financial liability
  Check: `ProcessVendorInvoiceCommand` creates a financial entry
  
- DF-INT-07: Procurement→Assets: GRN for capital goods triggers asset registration
  Check: `RecordGoodsReceiptCommandHandler` calls `RegisterAssetCommand` for capital items
  
- DF-INT-08: Results→CRM: published results appended to student profile
  Check: `PublishResultsCommandHandler` saves result summary to student record
  
- DF-INT-09: All Modules→Notify: events trigger notifications
  Check: At least these events trigger SMS/email: absence, fee overdue, result published, exam reminder
  
- DF-INT-10: All Modules→Analytics: events stream to analytics layer
  Check: Dashboard queries aggregate real-time data from all modules

---

# ═══════════════════════════════════════════
# AUDIT SECTION 7 — SECURITY (PRD §11)
# ═══════════════════════════════════════════

## 7.1 Identity and Access Management (PRD §11.1)
- [ ] MFA mandatory for SystemAdmin and Principal
- [ ] SAML 2.0 SSO stub (Sustainsys.Saml2)
- [ ] Principle of least privilege on all endpoints
- [ ] Dormant accounts suspended after 90 days (is there a Hangfire job for this?)

## 7.2 Data Encryption (PRD §11.2)
- [ ] Passwords hashed (ASP.NET Core Identity PasswordHasher)
- [ ] TLS in transit (UseHttpsRedirection)
- [ ] No plaintext PII in logs (check Serilog destructuring policies)
- [ ] Database connection string not hardcoded in source (uses environment variables)

## 7.3 Application Security (PRD §11.3)
- [ ] OWASP ASVS Level 2 compliance
  - Input validation on all endpoints (FluentValidation)
  - SQL injection prevention (EF Core parameterized queries)
  - XSS prevention (React escapes by default)
  - CSRF protection
- [ ] SonarQube or similar SAST tool configured
- [ ] OWASP ZAP DAST scan configured

## 7.4 Network Security (PRD §11.4)
- [ ] All backend services in Docker internal network (not exposed to host except API)
- [ ] WAF — is there any WAF configuration?

## 7.5 Audit and Logging (PRD §11.5)
- [ ] Audit.NET configured in FamsDbContext
- [ ] Every Create/Update/Delete logged with: user, IP, timestamp, before/after values
- [ ] Seq running and receiving logs
- [ ] Anomaly detection (any alert on unusual access patterns?)

## 7.6 Data Privacy (PRD §11.6)
- [ ] PII pseudonymized in non-production environments
- [ ] Data subject deletion workflow (GDPR-style)
- [ ] Third-party data sharing governed by agreements

---

# ═══════════════════════════════════════════
# AUDIT SECTION 8 — SCALABILITY (PRD §12)
# ═══════════════════════════════════════════

- [ ] PRD §12.1: Can a new campus be added via admin config without code deployment?
  Check: Is there a "Create Campus" endpoint that works without migration?
  
- [ ] PRD §12.2: HPA configured in docker-compose (deploy.replicas)?
  Check: Is docker-compose set up for multiple API replicas?
  
- [ ] PRD §12.3: PostgreSQL table partitioning by campus_id + academic_year?
  Check: Are high-volume tables (Attendance, AuditLogs) partitioned?
  
- [ ] PRD §12.4: New modules can be added without affecting existing ones?
  Check: Is each module truly independent (no tight coupling in handlers)?
  
- [ ] PRD §12.5: Message broker scales independently?
  Check: Is Hangfire or Redis Streams used for async events?

---

# ═══════════════════════════════════════════
# AUDIT SECTION 9 — 32-CAMPUS REQUIREMENT
# ═══════════════════════════════════════════

The system serves 32 campuses: 1 Main HQ + 31 sub-campuses.

- [ ] Is `IsMainCampus` field on Campus entity?
- [ ] Are 32 campuses seeded in `DbSeeder.cs`?
- [ ] Does Super Admin see ALL 32 campuses in dashboard?
- [ ] Does campus-scoped user (Principal) see ONLY their campus data?
- [ ] Does the campus selector in Super Admin portal show all 32?
- [ ] Can Super Admin generate cross-campus comparison reports?
- [ ] Does RLS prevent campus A users from seeing campus B data?

---

# ═══════════════════════════════════════════
# AUDIT SECTION 10 — FOUR PORTALS REQUIREMENT
# ═══════════════════════════════════════════

## Portal 1: Super Admin
- [ ] Route: /super-admin/*
- [ ] Layout: SuperAdminLayout.tsx with dark navy sidebar
- [ ] Dashboard: cross-campus KPIs, system health
- [ ] Campuses page: all 32 campuses, add/edit/deactivate
- [ ] Users page: all users, create/edit/assign role+campus
- [ ] Audit Logs viewer
- [ ] System Configuration: terms, fee templates, grading scales, notification templates

## Portal 2: Campus Head / School Admin
- [ ] Route: /campus/*
- [ ] Layout: CampusLayout.tsx
- [ ] Dashboard: campus KPIs (students, attendance, fees, staff)
- [ ] All 8 modules accessible from sidebar
- [ ] Data scoped to assigned campus only

## Portal 3: Teacher
- [ ] Route: /teacher/*
- [ ] Layout: TeacherLayout.tsx
- [ ] Dashboard: today's schedule, pending attendance
- [ ] Attendance marking: tablet-optimized, offline-capable
- [ ] Marks entry: by subject + assessment type
- [ ] View own students only
- [ ] Leave application
- [ ] View own payslip

## Portal 4: Student
- [ ] Route: /student/*
- [ ] Layout: StudentLayout.tsx
- [ ] Dashboard: attendance%, fees, upcoming exams, today's timetable
- [ ] Attendance: calendar view, eligibility status
- [ ] Results: grade cards with download
- [ ] Fee: invoices, payment history, online payment button
- [ ] Documents: admit card, enrollment certificate downloads
- [ ] AI Chatbot floating widget

---

# ═══════════════════════════════════════════
# FINAL COMPLIANCE REPORT
# ═══════════════════════════════════════════

After completing all audit sections above, generate this report:

```
═══════════════════════════════════════════════════════
FAMS PRD COMPLIANCE AUDIT REPORT
Generated: [date]
PRD Version: 1.0
═══════════════════════════════════════════════════════

SECTION 1 — SYSTEM OVERVIEW
  Presentation Layer:    [X/5 items] ✅ [Y items] ❌
  API Gateway:           [X/4 items] ✅ [Y items] ❌
  Application Layer:     [X/6 items] ✅ [Y items] ❌
  Data Layer:            [X/5 items] ✅ [Y items] ❌
  Infrastructure:        [X/3 items] ✅ [Y items] ❌
  Integrations:          [X/4 items] ✅ [Y items] ❌

SECTION 2 — USER ROLES
  [Role name]: COMPLETE ✅ / PARTIAL ⚠️ / MISSING ❌
  [for all 10 roles]

SECTION 3 — FUNCTIONAL REQUIREMENTS
  FR-CRM-01 to FR-CRM-09:  [X/9] ✅
  FR-ADM-01 to FR-ADM-09:  [X/9] ✅
  FR-PRC-01 to FR-PRC-09:  [X/9] ✅
  FR-TT-01  to FR-TT-05:   [X/5] ✅
  FR-ATT-01 to FR-ATT-07:  [X/7] ✅
  FR-EXM-01 to FR-EXM-06:  [X/6] ✅
  FR-RES-01 to FR-RES-10:  [X/10] ✅
  FR-FEE-01 to FR-FEE-08:  [X/8] ✅
  FR-PAY-01 to FR-PAY-06:  [X/6] ✅
  FR-HRM-01 to FR-HRM-11:  [X/11] ✅
  FR-AST-01 to FR-AST-09:  [X/9] ✅
  FR-PLT-01 to FR-PLT-10:  [X/10] ✅
  TOTAL FR COMPLIANCE:      [X/99] ([Y]%)

SECTION 4 — NON-FUNCTIONAL REQUIREMENTS
  NFR-01 Performance:      ✅/❌
  NFR-02 Concurrency:      ✅/❌
  NFR-03 Availability:     ✅/❌
  NFR-05 Backup:           ✅/❌
  NFR-09 MFA:              ✅/❌
  NFR-10 Encryption:       ✅/❌
  NFR-11 Session timeout:  ✅/❌
  NFR-12 Responsive:       ✅/❌
  NFR-13 Accessibility:    ✅/❌
  NFR-14 Test coverage:    ✅/❌
  NFR-16 Audit logs:       ✅/❌

SECTION 5 — ARCHITECTURE COMPLIANCE:     [X/15] ✅
SECTION 6 — DATA FLOWS IMPLEMENTED:      [X/10] ✅
SECTION 7 — SECURITY IMPLEMENTED:        [X/20] ✅
SECTION 8 — SCALABILITY READY:           [X/5]  ✅
SECTION 9 — 32-CAMPUS SUPPORT:           [X/7]  ✅
SECTION 10 — 4 PORTALS COMPLETE:         [X/4]  ✅

═══════════════════════════════════════════════════════
OVERALL PRD COMPLIANCE: [X]%
═══════════════════════════════════════════════════════

CRITICAL GAPS (must fix before go-live):
1. [List each ❌ item that blocks production use]

MEDIUM GAPS (should fix in next sprint):
1. [List each ⚠️ item]

MINOR GAPS (can defer to Phase 2):
1. [List each item that is out-of-scope per PRD §4.2]

RECOMMENDED NEXT ACTIONS (in priority order):
1. [Action 1]
2. [Action 2]
...
```

After generating the report, fix every CRITICAL GAP immediately.
For MEDIUM GAPS, generate the code and file it in the correct location.
For MINOR GAPS, create a GitHub issue comment in the README under "Phase 2 Backlog".
