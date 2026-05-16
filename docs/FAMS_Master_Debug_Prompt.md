# FAMS — Master Debug, Fix & Complete Prompt
## Paste this into Claude Code from your D:\FAMS directory

---

## THE PROMPT

---

You are a senior full-stack .NET 8 + React developer and DevOps engineer. You are working on the **FAMS (Falcon Academic Management System)** project located at `D:\FAMS\src\FAMS`.

Your job is to do a **complete audit, debug, and fix** of the entire project. Read all documentation first, then systematically find and fix every issue.

---

## STEP 1 — READ ALL DOCUMENTATION FIRST

Read every file in the docs folder before doing anything else:

```
D:\FAMS\src\FAMS\docs\FAMS_Complete_Document.md
D:\FAMS\src\FAMS\docs\FAMS_Master_Setup_Prompt.md
D:\FAMS\src\FAMS\docs\FAMS_Complete_Dev_Prompts.md
```

These files contain:
- All 8 functional modules and every requirement (FR-CRM-01 through FR-AST-09)
- All 16 non-functional requirements (NFR-01 through NFR-16)
- Complete tech stack (ASP.NET Core 8, React 18, PostgreSQL, Redis, MinIO, YARP, Hangfire, SignalR, QuestPDF, Audit.NET, etc.)
- The complete folder structure that MUST exist
- All NuGet packages with exact versions
- All environment variables
- All API endpoints

Understand everything before proceeding.

---

## STEP 2 — FULL PROJECT AUDIT

Scan the entire project at `D:\FAMS\src\FAMS` and create a report covering:

### 2.1 Folder Structure Check
Verify these folders and files exist. List every MISSING item:
```
FAMS/
├── FAMS.slnx
├── .env or .env.example
├── .gitignore
├── docker-compose.yml
├── README.md
├── docs/
│   ├── FAMS_Complete_Document.md
│   ├── FAMS_Master_Setup_Prompt.md
│   └── FAMS_Complete_Dev_Prompts.md
├── src/
│   ├── FAMS.API/
│   │   ├── FAMS.API.csproj
│   │   ├── Program.cs
│   │   ├── appsettings.json
│   │   ├── appsettings.Development.json
│   │   ├── Dockerfile
│   │   ├── Controllers/
│   │   │   ├── AuthController.cs
│   │   │   ├── StudentsController.cs
│   │   │   ├── AdmissionsController.cs
│   │   │   ├── AttendanceController.cs
│   │   │   ├── TimetableController.cs
│   │   │   ├── ExaminationsController.cs
│   │   │   ├── ResultsController.cs
│   │   │   ├── FeeController.cs
│   │   │   ├── PayrollController.cs
│   │   │   ├── HrmController.cs
│   │   │   ├── ProcurementController.cs
│   │   │   ├── AssetsController.cs
│   │   │   ├── ChatbotController.cs
│   │   │   ├── DashboardController.cs
│   │   │   └── HealthController.cs
│   │   ├── Middleware/
│   │   │   └── GlobalExceptionMiddleware.cs
│   │   ├── Hubs/
│   │   │   └── NotificationHub.cs
│   │   └── Extensions/
│   │       └── ServiceExtensions.cs
│   │
│   ├── FAMS.Application/
│   │   ├── FAMS.Application.csproj
│   │   ├── DependencyInjection.cs
│   │   ├── Common/
│   │   │   ├── Behaviors/
│   │   │   │   ├── ValidationBehavior.cs
│   │   │   │   ├── LoggingBehavior.cs
│   │   │   │   └── AuthorizationBehavior.cs
│   │   │   ├── Interfaces/
│   │   │   │   ├── IFamsDbContext.cs
│   │   │   │   ├── ICurrentUserService.cs
│   │   │   │   ├── IEmailService.cs
│   │   │   │   ├── ISmsService.cs
│   │   │   │   ├── IStorageService.cs
│   │   │   │   ├── IPdfService.cs
│   │   │   │   ├── IAiChatbotService.cs
│   │   │   │   └── IDateTime.cs
│   │   │   ├── Models/
│   │   │   │   ├── Result.cs
│   │   │   │   └── PaginatedList.cs
│   │   │   └── Exceptions/
│   │   │       ├── ValidationException.cs
│   │   │       ├── NotFoundException.cs
│   │   │       └── UnauthorizedException.cs
│   │   └── Modules/
│   │       ├── Auth/
│   │       ├── CRM/
│   │       ├── Admissions/
│   │       ├── Academic/
│   │       ├── Results/
│   │       ├── Finance/
│   │       ├── HRM/
│   │       ├── Procurement/
│   │       └── Assets/
│   │
│   ├── FAMS.Domain/
│   │   ├── FAMS.Domain.csproj
│   │   ├── Common/
│   │   │   ├── BaseEntity.cs
│   │   │   ├── BaseAuditableEntity.cs
│   │   │   └── IDomainEvent.cs
│   │   ├── Entities/
│   │   │   ├── Campus.cs
│   │   │   ├── Student.cs
│   │   │   ├── Parent.cs
│   │   │   ├── Staff.cs
│   │   │   ├── Program.cs
│   │   │   ├── ClassRoom.cs
│   │   │   ├── Section.cs
│   │   │   ├── Subject.cs
│   │   │   ├── Attendance.cs
│   │   │   ├── FeeInvoice.cs
│   │   │   ├── FeePayment.cs
│   │   │   ├── Result.cs
│   │   │   ├── Leave.cs
│   │   │   ├── Asset.cs
│   │   │   ├── Vendor.cs
│   │   │   ├── PurchaseOrder.cs
│   │   │   ├── POLineItem.cs
│   │   │   └── AuditLog.cs
│   │   └── Enums/
│   │       ├── StudentStatus.cs
│   │       ├── Gender.cs
│   │       ├── UserRole.cs
│   │       ├── AssetStatus.cs
│   │       ├── LeaveType.cs
│   │       ├── PaymentStatus.cs
│   │       └── ApplicationStatus.cs
│   │
│   ├── FAMS.Infrastructure/
│   │   ├── FAMS.Infrastructure.csproj
│   │   ├── DependencyInjection.cs
│   │   ├── Persistence/
│   │   │   ├── FamsDbContext.cs
│   │   │   ├── DbSeeder.cs
│   │   │   ├── Migrations/
│   │   │   └── Configurations/
│   │   ├── Identity/
│   │   │   ├── ApplicationUser.cs
│   │   │   └── ApplicationRole.cs
│   │   └── Services/
│   │       ├── CurrentUserService.cs
│   │       ├── EmailService.cs
│   │       ├── SmsService.cs
│   │       ├── StorageService.cs
│   │       ├── PdfService.cs
│   │       ├── AiChatbotService.cs
│   │       ├── JwtTokenService.cs
│   │       └── DateTimeService.cs
│   │
│   └── FAMS.Gateway/
│       ├── FAMS.Gateway.csproj
│       ├── Program.cs
│       └── appsettings.json
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts (or .js)
│   ├── postcss.config.js
│   ├── index.html
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       ├── api/
│       │   └── axiosClient.ts
│       ├── lib/
│       │   └── signalrClient.ts
│       ├── store/
│       │   └── authStore.ts
│       ├── types/
│       │   └── api.types.ts
│       ├── pages/
│       │   ├── auth/LoginPage.tsx
│       │   ├── dashboard/DashboardPage.tsx
│       │   ├── students/StudentsPage.tsx
│       │   ├── attendance/AttendancePage.tsx
│       │   └── fee/FeePage.tsx
│       └── components/
│           ├── layout/AppLayout.tsx
│           ├── ui/DataTable.tsx
│           ├── ui/KpiCard.tsx
│           └── chatbot/ChatbotWidget.tsx
│
├── tests/
│   ├── FAMS.UnitTests/
│   └── FAMS.IntegrationTests/
│
└── infra/
    ├── postgres/init.sql
    ├── prometheus/prometheus.yml
    └── grafana/provisioning/datasources/datasource.yml
```

### 2.2 .csproj Package Audit
Read each .csproj file and check for these REQUIRED packages. List every missing one:

**FAMS.API must have:**
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

**FAMS.Application must have:**
- MediatR 12.4.1
- FluentValidation 11.10.0
- FluentValidation.DependencyInjectionExtensions 11.10.0
- AutoMapper 13.0.1

**FAMS.Infrastructure must have:**
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

### 2.3 Frontend Package Audit
Read `frontend/package.json` and check for these REQUIRED packages. List every missing one:
- react@18.3.1, react-dom@18.3.1
- typescript@5.5.3
- vite@5.4.1, @vitejs/plugin-react@4.3.1
- tailwindcss@3.4.10, postcss@8.4.41, autoprefixer@10.4.20
- @tanstack/react-query@5.56.2
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

### 2.4 Build Error Check
Run these commands and capture ALL errors:
```
dotnet build D:\FAMS\src\FAMS\FAMS.sln
```
List every error with file name and line number.

### 2.5 Frontend Error Check
Run from `D:\FAMS\src\FAMS\frontend`:
```
npx tsc --noEmit
```
List every TypeScript error.

### 2.6 Critical Config File Checks

**Check Program.cs has ALL of these registrations:**
- Serilog configured with Seq + Console sinks
- AddInfrastructure() called
- MediatR registered with FAMS.Application assembly
- FluentValidation registered
- ValidationBehavior pipeline registered
- LoggingBehavior pipeline registered
- JWT Bearer authentication configured with Issuer, Audience, SecretKey validation
- Authorization policies: SystemAdmin, PrincipalOrAbove, TeacherOrAbove, FinanceAccess, HrAccess, StudentPortal, ParentPortal
- CORS configured
- Swagger with JWT bearer security definition
- SignalR added and hub mapped to /hubs/notifications
- Prometheus metrics mapped to /metrics
- Health checks mapped to /health
- Hangfire dashboard mapped to /hangfire
- GlobalExceptionMiddleware used
- DbSeeder.SeedAsync() called in Development

**Check appsettings.json has ALL sections:**
- ConnectionStrings.DefaultConnection
- Jwt (SecretKey, Issuer, Audience, ExpiryMinutes)
- Redis (Connection)
- Minio (Endpoint, AccessKey, SecretKey, BucketDocuments, BucketExports, BucketAvatars)
- Seq (Url)
- Smtp (Host, Port, Username, Password, FromName)
- Twilio (AccountSid, AuthToken, FromNumber)
- JazzCash (MerchantId, Password, IntegritySalt, ApiUrl)
- Anthropic (ApiKey, Model)
- Cors (AllowedOrigins)

**Check vite.config.ts has:**
- proxy /api → http://localhost:5000
- proxy /hubs → http://localhost:5000 with ws:true
- path alias @ → ./src

**Check tailwind.config has:**
- content includes ./src/**/*.{ts,tsx}
- FAMS brand colors defined

**Check src/index.css has:**
- @tailwind base
- @tailwind components
- @tailwind utilities

**Check axiosClient.ts has:**
- baseURL: '/api' (NOT http://localhost:5000/api)
- request interceptor adding JWT Bearer token
- response interceptor handling 401 with token refresh

---

## STEP 3 — FIX EVERYTHING

After the audit, fix ALL issues found. For each fix:

### 3.1 Create ALL missing files
Generate complete, working content for every missing file identified in Step 2. Do not skip any file. Do not use placeholder comments like "// implement later" — write real working code.

### 3.2 Fix ALL missing NuGet packages
For every missing NuGet package, add it to the correct .csproj file with the exact version specified.

### 3.3 Fix ALL missing npm packages
For every missing npm package, add it to package.json with the exact version specified.

### 3.4 Fix ALL build errors
Fix every C# compilation error found in Step 2.4. Show the exact change made.

### 3.5 Fix ALL TypeScript errors
Fix every TypeScript error found in Step 2.5. Show the exact change made.

### 3.6 Fix ALL config issues
Fix every configuration problem found in Step 2.6.

### 3.7 Fix the Tailwind CSS issue
Ensure these files are correct:
- `tailwind.config.ts` with correct content paths and FAMS colors
- `postcss.config.js` with tailwindcss and autoprefixer plugins
- `src/index.css` with the 3 @tailwind directives at the top
- `vite.config.ts` importing tailwind correctly

### 3.8 Fix the Login issue
The login is not working. Fix these specific things:

1. Ensure `axiosClient.ts` uses `baseURL: '/api'` not absolute URL
2. Ensure `vite.config.ts` proxy is correctly set up
3. Ensure `LoginPage.tsx` posts to `/api/v1/auth/login`
4. Ensure the auth store saves the token to localStorage correctly
5. Ensure `AuthController.cs` exists and has a working POST /login endpoint
6. Ensure `DbSeeder.cs` seeds the admin user with:
   - Email: admin@fams.local
   - Password: Admin@12345!
   - Role: SystemAdmin
7. Ensure `Program.cs` calls `DbSeeder.SeedAsync()` on startup in Development

### 3.9 Fix Database / Migration issues
1. Ensure `FamsDbContext.cs` has all DbSet properties for all 18 entities
2. Ensure `FamsDbContext.cs` inherits `IdentityDbContext<ApplicationUser, ApplicationRole, Guid>`
3. Ensure `DependencyInjection.cs` in Infrastructure registers `FamsDbContext` with Npgsql
4. If Migrations folder is empty, output the exact commands to run

---

## STEP 4 — MISSING MODULE COMPLETION

Based on the docs in `D:\FAMS\src\FAMS\docs`, check which of the 8 modules are incomplete and generate ALL missing code:

### Module Checklist — generate everything missing:

**Module 1: CRM (Student & Parent Management)**
Required files per docs FR-CRM-01 to FR-CRM-09:
- [ ] GetStudentsQuery + Handler + StudentDto
- [ ] GetStudentByIdQuery + Handler + StudentDetailDto
- [ ] CreateStudentCommand + Validator + Handler
- [ ] UpdateStudentCommand + Validator + Handler
- [ ] UpdateStudentStatusCommand + Handler
- [ ] DeleteStudentCommand + Handler
- [ ] StudentsController with all 9 endpoints

**Module 2: Admissions (FR-ADM-01 to FR-ADM-09)**
- [ ] SubmitApplicationCommand + Validator + Handler
- [ ] ReviewApplicationCommand + Handler
- [ ] GenerateMeritListCommand + Handler
- [ ] GetApplicationsQuery + Handler + Dto
- [ ] GetAdmissionsFunnelQuery + Handler + Dto
- [ ] AdmissionsController with all endpoints

**Module 3: Academic Operations (FR-TT-01 to FR-EXM-06)**
- [ ] MarkAttendanceCommand + Handler (with SMS for absences)
- [ ] SyncOfflineAttendanceCommand + Handler
- [ ] GetAttendanceReportQuery + Handler + Dto
- [ ] CreateTimetableCommand + Handler (with conflict detection)
- [ ] GetTimetableQuery + Handler + Dto
- [ ] CreateExamScheduleCommand + Handler
- [ ] GenerateAdmitCardsCommand + Handler
- [ ] AttendanceController, TimetableController, ExaminationsController

**Module 4: Results & Reporting (FR-RES-01 to FR-RES-10)**
- [ ] EnterMarksCommand + Handler
- [ ] PublishResultsCommand + Handler
- [ ] GetStudentResultsQuery + Handler + Dto
- [ ] GetResultsAnalyticsQuery + Handler + Dto
- [ ] ResultsController with all endpoints

**Module 5: Finance — Fee Management (FR-FEE-01 to FR-FEE-08)**
- [ ] GenerateInvoicesCommand + Handler
- [ ] RecordPaymentCommand + Validator + Handler
- [ ] ApplyLateFeeCommand + Handler
- [ ] GetFeeInvoicesQuery + Handler + Dto
- [ ] GetFeeCollectionSummaryQuery + Handler + Dto
- [ ] FeeController with all endpoints

**Module 6: Finance — Payroll (FR-PAY-01 to FR-PAY-06)**
- [ ] ProcessPayrollCommand + Handler (with EOBI + tax calculation)
- [ ] ApprovePayrollCommand + Handler
- [ ] GetPayrollSummaryQuery + Handler + Dto
- [ ] PayrollController with all endpoints

**Module 7: HRM (FR-HRM-01 to FR-HRM-11)**
- [ ] CreateStaffCommand + Validator + Handler
- [ ] ApplyLeaveCommand + Validator + Handler
- [ ] ApproveLeaveCommand + Handler
- [ ] GetStaffListQuery + Handler + Dto
- [ ] GetHrAnalyticsQuery + Handler + Dto
- [ ] HrmController with all endpoints

**Module 8: Assets & Inventory (FR-AST-01 to FR-AST-09)**
- [ ] RegisterAssetCommand + Handler
- [ ] CalculateDepreciationCommand + Handler
- [ ] GetAssetsQuery + Handler + Dto
- [ ] AssetsController with all endpoints

**Procurement (FR-PRC-01 to FR-PRC-09)**
- [ ] CreatePurchaseRequisitionCommand + Handler
- [ ] ApprovePurchaseRequisitionCommand + Handler
- [ ] RecordGoodsReceiptCommand + Handler
- [ ] ProcurementController with all endpoints

**Cross-Cutting Platform (FR-PLT-01 to FR-PLT-10)**
- [ ] ChatbotController calling AiChatbotService
- [ ] NotificationHub (SignalR)
- [ ] DashboardController with 5 role-specific endpoints
- [ ] Dashboard queries for each role (Executive, Principal, Teacher, Student, Parent)

---

## STEP 5 — FRONTEND COMPLETION

Check which frontend pages exist and generate ALL missing ones:

- [ ] LoginPage.tsx — with Tailwind styling, React Hook Form + Zod validation
- [ ] DashboardPage.tsx — role-based dashboard routing
- [ ] PrincipalDashboard.tsx — KPI cards + charts
- [ ] StudentsPage.tsx — searchable/filterable data table
- [ ] StudentDetailPage.tsx — tabbed student profile
- [ ] AttendancePage.tsx — offline-capable tablet interface
- [ ] FeePage.tsx — invoices + payment recording
- [ ] AdmissionsPage.tsx — application pipeline funnel view
- [ ] ResultsPage.tsx — marks entry + result viewing
- [ ] HrmPage.tsx — staff list + leave management
- [ ] AppLayout.tsx — sidebar + header + notification bell
- [ ] DataTable.tsx — reusable generic table component
- [ ] KpiCard.tsx — dashboard KPI card component
- [ ] ChatbotWidget.tsx — floating AI chat widget
- [ ] ProtectedRoute.tsx — JWT + role guard component

---

## STEP 6 — DOCKER VERIFICATION

Check if these Docker files exist and are correct:

- [ ] `docker-compose.yml` — all 10 services defined
- [ ] `src/FAMS.API/Dockerfile` — multi-stage build
- [ ] `frontend/Dockerfile` — multi-stage Node build + Nginx
- [ ] `frontend/nginx.conf` — SPA fallback + proxy
- [ ] `infra/postgres/init.sql` — extensions + RLS function
- [ ] `infra/prometheus/prometheus.yml` — scrapes fams-api:5000/metrics
- [ ] `infra/grafana/provisioning/datasources/datasource.yml`

Fix any missing or incorrect file.

---

## STEP 7 — FINAL VERIFICATION

After all fixes are applied, run these commands and confirm they all pass:

```powershell
# 1. Build check
dotnet build D:\FAMS\src\FAMS\FAMS.sln
# Expected: Build succeeded. 0 Error(s)

# 2. TypeScript check
cd D:\FAMS\src\FAMS\frontend
npx tsc --noEmit
# Expected: no output (no errors)

# 3. Unit tests
dotnet test D:\FAMS\src\FAMS\tests\FAMS.UnitTests
# Expected: All tests passed

# 4. Health check (requires app running)
curl http://localhost:5000/health
# Expected: {"status":"healthy"}

# 5. Login test
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fams.local","password":"Admin@12345!"}'
# Expected: {"isSuccess":true,"value":{"accessToken":"eyJ..."}}
```

---

## DELIVERY REQUIREMENTS

1. Fix files IN PLACE — write directly to the correct paths under `D:\FAMS\src\FAMS\`
2. Every generated file must be complete — no TODOs, no placeholder code
3. All C# must compile without errors
4. All TypeScript must pass `tsc --noEmit`
5. The login must work after your fixes
6. Tailwind CSS must be applied — the UI must look styled
7. After all fixes, give me a summary report:
   - Files created: X
   - Files modified: X
   - NuGet packages added: X
   - npm packages added: X
   - Build errors fixed: X
   - Modules completed: X/9
   - Frontend pages completed: X/15

Start with Step 1 (reading docs), then proceed through all steps in order. Do not skip anything.
