# FAMS — Master Complete Debug + Portal + Module Prompt
## Paste this into Claude Code from D:\FAMS\src\FAMS directory

---

You are a senior full-stack .NET 8 + React developer. You are working on FAMS (Falcon Academic Management System) — an enterprise ERP for Falcon College with 32 campuses (1 Main HQ campus + 31 sub-campuses).

Read the PRD PDF first:
`D:\FAMS\src\FAMS\docs\FAMS_PRD_VERSION_1.pdf`

Then read all docs:
`D:\FAMS\src\FAMS\docs\FAMS_Complete_Document.md`
`D:\FAMS\src\FAMS\docs\FAMS_Complete_Dev_Prompts.md`

Understand everything before touching any code.

---

# PART 1 — IMMEDIATE BUG FIXES (do these first)

## BUG 1 — HRM Page crash: "Cannot read properties of undefined (reading 'toFixed')"

File: `frontend/src/pages/hrm/HrmPage.tsx` (or HrmPage component)

Find every `.toFixed()` call and make it null-safe:
```
WRONG:  value.toFixed(2)
RIGHT:  (value ?? 0).toFixed(2)

WRONG:  data.monthlySalary.toFixed(2)
RIGHT:  (data?.monthlySalary ?? 0).toFixed(2)

WRONG:  stats.totalPayroll.toFixed(2)
RIGHT:  (stats?.totalPayroll ?? 0).toFixed(2)
```

Also fix any `.toLocaleString()` calls the same way:
```
WRONG:  amount.toLocaleString()
RIGHT:  (amount ?? 0).toLocaleString()
```

Add null guard at top of every dashboard/stats component:
```tsx
if (!data || loading) return (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);
```

## BUG 2 — Attendance API 400 Bad Request on /api/academic/attendance

The attendance save is returning 400. Fix the request payload in `AttendancePage.tsx`:

Check that the POST body matches exactly what the backend expects:
```typescript
// The payload must include ALL required fields:
{
  sectionId: string,       // must be valid GUID
  date: string,            // ISO format: "2026-05-15T00:00:00Z"
  markedById: string,      // current user ID from JWT
  entries: [
    {
      studentId: string,   // valid GUID
      isPresent: boolean,
      isLate: boolean,
      remarks: string | null
    }
  ]
}
```

If sectionId is coming from a dropdown that stores section names instead of GUIDs, fix it to store and send the actual GUID.

## BUG 3 — WebSocket connection to ws://127.0.0.1:5500 failing

This is VS Code Live Server interfering. It's harmless but noisy. In `vite.config.ts` add:
```typescript
server: {
  hmr: {
    host: 'localhost'
  }
}
```

---

# PART 2 — FOUR PORTALS ARCHITECTURE

The system must have exactly FOUR distinct portals, each with its own layout, navigation, and data scope:

## PORTAL 1 — SUPER ADMIN PORTAL
**Who:** System Administrator (RaideIT ops team)
**Scope:** ALL 32 campuses (1 Main HQ + 31 sub-campuses)
**Access:** Full system access, cross-campus visibility

### Features required:
- Executive KPI dashboard showing ALL 32 campuses combined:
  - Total students (all campuses), Total staff (all campuses)
  - Total fee collected (all campuses this month)
  - Overall attendance rate (all campuses today)
  - Campus-wise comparison charts (bar chart: students per campus)
  - Fee collection by campus (heat map or bar)
  - System health indicators (API response time, active users, errors)
- Campus Management:
  - List all 32 campuses with status (Active/Inactive)
  - Add new campus
  - Edit campus details (name, city, principal, capacity)
  - Activate/deactivate campus
- User Management (all campuses):
  - Create/edit/delete users
  - Assign roles and campus scope
  - Reset passwords
  - View login history
  - Enable/disable MFA
- System Configuration:
  - Academic year/term setup
  - Fee structure templates
  - Grading scale configuration
  - Notification templates (SMS/email)
- Audit Logs viewer (all campuses, filterable by campus/user/action/date)
- Hangfire dashboard link
- Seq logs link

**Navigation items:**
Dashboard | Campuses | Users | Students (all) | Staff (all) | Finance (all) | Audit Logs | System Config | Reports

---

## PORTAL 2 — CAMPUS HEAD / SCHOOL ADMIN PORTAL
**Who:** Principal / Campus Head
**Scope:** SINGLE assigned campus only (campus_id scoped)
**Access:** Full operational control of their campus

### Features required:
- Campus dashboard KPIs:
  - Students enrolled, Staff count, Today's attendance %, Outstanding fees
  - Recent admissions list (last 5)
  - Fee collection this month vs target
  - At-risk students count (attendance < 75%)
  - Upcoming exams this week
- Student Management:
  - Full student list with search/filter (name, roll, class, section, status)
  - Student detail view (360-degree: personal, attendance, results, fees, documents)
  - Add/edit student
  - Change student status (enroll, withdraw, suspend)
  - Bulk operations (promote class, bulk status update)
- Admissions:
  - Application pipeline funnel view
  - Review and approve/reject applications
  - Generate merit lists
  - Issue offer letters
  - Enrollment confirmation
- Academic Operations:
  - Timetable management (create, publish, view conflicts)
  - Examination scheduling
  - Admit card generation
  - Seating plans
  - Substitute teacher assignment
- Results:
  - Review and approve results submitted by teachers
  - Publish results to student/parent portals
  - Generate grade cards (PDF)
  - At-risk student reports
- Finance:
  - Fee collection summary and outstanding reports
  - Generate fee invoices for all students
  - Apply late fees
  - View payment history
  - Approve payroll
  - Expense reports
- HRM:
  - Staff list with full profiles
  - Approve leave requests
  - Staff attendance summary
  - Performance appraisal
  - Disciplinary records
- Procurement:
  - Approve purchase requisitions
  - View purchase orders
  - Vendor registry
- Reports:
  - Attendance reports (daily/weekly/monthly)
  - Academic performance reports
  - Fee collection reports
  - Staff reports
  - All exportable as PDF and Excel

**Navigation items:**
Dashboard | Students | Admissions | Timetable | Examinations | Results | Fee | Payroll | HRM | Procurement | Assets | Reports

---

## PORTAL 3 — TEACHER PORTAL
**Who:** Teaching staff (Teachers, Academic Coordinators)
**Scope:** Own data + assigned classes/sections only
**Access:** Read own schedule, mark attendance, enter marks, view assigned students

### Features required:
- Teacher dashboard:
  - Today's class schedule (timetable for today)
  - Classes taught, Students assigned
  - Pending attendance entries (classes where attendance not yet marked)
  - Recent marks entries
  - Upcoming exam invigilation duties
- My Timetable:
  - Weekly view of all assigned classes
  - Printable timetable
- Attendance Marking (CORE FEATURE — tablet optimized):
  - Select class/section from dropdown
  - Date picker (default: today)
  - Student list with Present/Absent/Late/Leave toggle buttons
  - Large touch targets for tablet use (FR-ATT-01)
  - Real-time count: Present X | Absent X | Late X
  - Submit button
  - OFFLINE MODE: when navigator.onLine === false, show orange banner "Network unavailable — queued for sync when online"
  - Store in IndexedDB when offline, auto-sync when back online
  - Show pending sync count badge
- My Students:
  - List of students in assigned sections
  - Click student → view profile (read-only: personal info, attendance in my class, results in my subjects)
- Marks Entry:
  - Select subject → select assessment type (Quiz/Mid/Final/Assignment)
  - Enter marks for each student in assigned section
  - Bulk import via Excel template
  - Submit for coordinator review
- My Results:
  - View published results for my subjects
  - View my students' academic progress
- Leave Application:
  - Apply for leave (type, dates, reason, documents)
  - View leave balance and history
  - Track approval status
- My Profile:
  - Personal info, qualifications, employment details (read-only)
  - View my payslip
  - Change password

**Navigation items:**
Dashboard | My Schedule | Mark Attendance | My Students | Enter Marks | My Results | Apply Leave | My Profile

---

## PORTAL 4 — STUDENT PORTAL
**Who:** Enrolled students
**Scope:** Own data ONLY
**Access:** Read-only for most things, self-service for some

### Features required:
- Student dashboard:
  - My attendance percentage (this term)
  - Outstanding fee balance
  - Upcoming exam schedule (next 3 exams)
  - Recent result/grade notification
  - Today's timetable
- My Timetable:
  - Weekly class schedule
  - Upcoming exam timetable
- My Attendance:
  - Monthly calendar view (Green = Present, Red = Absent, Yellow = Late, Grey = Holiday)
  - Summary: Present %, Absent days, Late days
  - Eligibility status for each subject (≥75% = Eligible, <75% = Warning)
  - Apply for leave (reason + upload document)
- My Results:
  - Result cards by term
  - Subject-wise marks breakdown
  - Grade, rank in class/section
  - Academic progress chart (trend over terms)
  - Download grade card as PDF
- My Fee:
  - Current fee invoice with due date
  - Payment history (all receipts)
  - Outstanding balance
  - Download receipts as PDF
  - Pay online (JazzCash/Easypaisa button — triggers payment gateway)
- My Documents:
  - Download admit card (if exam upcoming and eligible)
  - Download enrollment certificate
  - Download grade cards
- AI Chatbot (bottom-right floating button):
  - Ask about fee balance, exam schedule, results, timetable
  - Powered by Anthropic Claude API
- Change Password
- Notification center (in-app alerts for: attendance, results, fee reminders)

**Navigation items:**
Dashboard | My Timetable | Attendance | Results | Fee | Documents | Chatbot

---

# PART 3 — PORTAL ROUTING & LAYOUT IMPLEMENTATION

## 3.1 Update App.tsx with 4 portal routing

```tsx
// App.tsx — complete routing with 4 portals
// After login, redirect based on role:
// SystemAdmin → /super-admin/dashboard
// Principal → /campus/dashboard  
// Teacher, AcademicCoordinator → /teacher/dashboard
// Student → /student/dashboard
// Parent → /parent/dashboard (if implemented)
// Accountant → /campus/dashboard (with limited nav)
// HrOfficer → /campus/dashboard (with limited nav)

// Each portal has its own layout component with role-specific navigation
```

## 3.2 Create Portal Layout Components

FILE: `frontend/src/layouts/SuperAdminLayout.tsx`
- Dark navy sidebar (#0F1B2D)
- Logo: "FAMS" + "Super Admin" badge in red
- Nav: Dashboard, Campuses, Users, Students, Staff, Finance, Audit, Config
- Header: campus count badge, user name, logout
- Campus selector dropdown showing "All Campuses (32)"

FILE: `frontend/src/layouts/CampusLayout.tsx`
- Navy sidebar (#1B4F8A)
- Logo: "FAMS" + campus name
- Nav: Dashboard, Students, Admissions, Timetable, Exams, Results, Fee, Payroll, HRM, Procurement, Assets, Reports
- Header: campus name, user name + role, notification bell, logout

FILE: `frontend/src/layouts/TeacherLayout.tsx`
- Clean sidebar, lighter theme
- Nav: Dashboard, My Schedule, Mark Attendance, My Students, Enter Marks, My Results, Leave, Profile
- Header: "Teacher Portal", user name, offline indicator dot (green/red)

FILE: `frontend/src/layouts/StudentLayout.tsx`
- Clean, friendly UI, lighter colors
- Nav: Dashboard, Timetable, Attendance, Results, Fee, Documents
- Header: student name, roll number, campus name
- Floating chatbot button (bottom-right)

---

# PART 4 — MISSING MODULES — GENERATE ALL

Based on the PRD, these modules must be fully implemented. Check each one and generate what's missing:

## MODULE CHECK 1: CRM — Student & Parent Management
Backend (FAMS.Application/Modules/CRM/):
- [ ] GetStudentsQuery + Handler + StudentDto
- [ ] GetStudentByIdQuery + Handler + StudentDetailDto (360-degree view: attendance %, fee status, results, documents)
- [ ] CreateStudentCommand + Validator + Handler
- [ ] UpdateStudentCommand + Validator + Handler  
- [ ] UpdateStudentStatusCommand + Handler
- [ ] DeleteStudentCommand + Handler (soft delete)
- [ ] GetParentsQuery + Handler + ParentDto
- [ ] LinkStudentToParentCommand + Handler
- [ ] GetFamilyStudentsQuery + Handler (FR-CRM-09 family linkage)

Frontend pages:
- [ ] StudentsPage.tsx — searchable table with roll, name, class, status filters
- [ ] StudentDetailPage.tsx — tabbed: Overview, Attendance, Results, Fee, Documents
- [ ] AddStudentDialog.tsx — form with validation
- [ ] ParentsPage.tsx

## MODULE CHECK 2: Admissions (FR-ADM-01 to FR-ADM-09)
Backend:
- [ ] SubmitApplicationCommand (public endpoint, no auth)
- [ ] ReviewApplicationCommand (approve/reject/offer)
- [ ] GenerateMeritListCommand
- [ ] GetApplicationsQuery (paginated, filterable by status)
- [ ] GetAdmissionsFunnelQuery (counts per stage)
- [ ] BulkImportStudentsCommand (CSV/Excel — FR-ADM-08)

Frontend:
- [ ] AdmissionsPage.tsx — funnel view with stage counts
- [ ] ApplicationsTable.tsx — list with review actions
- [ ] PublicApplicationForm.tsx — accessible without login (FR-ADM-01)

## MODULE CHECK 3: Academic Operations
### Timetable (FR-TT-01 to FR-TT-05):
- [ ] CreateTimetableCommand + Handler (conflict detection)
- [ ] GetTimetableQuery (by section or teacher)
- [ ] TimetablePage.tsx — weekly grid view
- [ ] ConflictAlert component

### Attendance (FR-ATT-01 to FR-ATT-07):
- [ ] MarkAttendanceCommand + Handler (fix the 400 error)
- [ ] SyncOfflineAttendanceCommand + Handler
- [ ] GetAttendanceReportQuery + Handler
- [ ] AttendancePage.tsx — tablet-optimized (ALREADY EXISTS, fix the 400 bug)
- [ ] Offline sync with IndexedDB (Dexie.js)

### Examinations (FR-EXM-01 to FR-EXM-06):
- [ ] CreateExamScheduleCommand + Handler
- [ ] GenerateAdmitCardsCommand + Handler  
- [ ] GenerateSeatingPlanCommand + Handler
- [ ] ExaminationsPage.tsx — schedule + room allocation
- [ ] AdmitCardPage.tsx (student portal)

## MODULE CHECK 4: Results & Reporting (FR-RES-01 to FR-RES-10)
Backend:
- [ ] EnterMarksCommand + Handler
- [ ] ComputeResultsCommand + Handler (auto-calculate grade, pass/fail, rank)
- [ ] PublishResultsCommand + Handler (multi-stage: teacher → coordinator → principal)
- [ ] GetStudentResultsQuery + Handler
- [ ] GetResultsAnalyticsQuery (cross-campus pass rates, grade distributions)
- [ ] GetAtRiskStudentsQuery (attendance < 75% OR marks < passing threshold)

Frontend:
- [ ] ResultsPage.tsx (teacher view: enter marks by subject)
- [ ] ResultApprovalPage.tsx (principal view: approve and publish)
- [ ] StudentResultsPage.tsx (student portal: view own results)
- [ ] GradeCardDownload component (PDF via backend)

## MODULE CHECK 5: Finance — Fee Management (FR-FEE-01 to FR-FEE-08)
Backend:
- [ ] GenerateInvoicesCommand (bulk, all students)
- [ ] RecordPaymentCommand + Validator + Handler
- [ ] ApplyLateFeeCommand (scheduled via Hangfire)
- [ ] ApplyConcessionCommand (merit/sibling/need-based — FR-FEE-06)
- [ ] ProcessRefundCommand (FR-FEE-07)
- [ ] GetFeeInvoicesQuery (paginated, filterable)
- [ ] GetFeeCollectionSummaryQuery
- [ ] GetDefaultersListQuery

Frontend:
- [ ] FeePage.tsx — tabs: Invoices, Record Payment, Summary, Defaulters
- [ ] FeeInvoiceTable.tsx — with status badges and pay button
- [ ] RecordPaymentDialog.tsx
- [ ] StudentFeePage.tsx (student portal: view own invoices, pay online)

## MODULE CHECK 6: Finance — Payroll (FR-PAY-01 to FR-PAY-06)
Backend:
- [ ] ProcessPayrollCommand + Handler (EOBI 1%+5%, Pakistani income tax slabs)
- [ ] ApprovePayrollCommand + Handler
- [ ] GetPayrollSummaryQuery
- [ ] GetMyPayslipQuery (teacher/staff portal)
- [ ] GeneratePayslipPdfCommand (calls IPdfService)

Frontend:
- [ ] PayrollPage.tsx (campus admin: process, review, approve)
- [ ] PayslipView.tsx (teacher portal: view and download payslip)

## MODULE CHECK 7: HRM (FR-HRM-01 to FR-HRM-11)
Backend:
- [ ] CreateStaffCommand + Validator + Handler
- [ ] UpdateStaffCommand + Handler
- [ ] ApplyLeaveCommand + Validator + Handler
- [ ] ApproveLeaveCommand + Handler
- [ ] GetStaffListQuery + Handler + StaffDto
- [ ] GetLeaveRequestsQuery + Handler
- [ ] GetHrAnalyticsQuery (headcount, turnover, leave utilization)
- [ ] GetOrgChartQuery (hierarchical data for org chart — FR-HRM-10)

Frontend:
- [ ] HrmPage.tsx — fix the toFixed crash, tabs: Staff, Leave, Analytics
- [ ] StaffDetailPage.tsx — full profile, leave history, payslip history
- [ ] OrgChart.tsx — visual hierarchy using D3 or a tree component
- [ ] LeaveManagementPage.tsx — pending approvals list

## MODULE CHECK 8: Procurement (FR-PRC-01 to FR-PRC-09)
Backend:
- [ ] CreatePurchaseRequisitionCommand + Handler
- [ ] ApprovePurchaseRequisitionCommand + Handler (multi-level: HOD → Principal → Finance)
- [ ] GeneratePurchaseOrderCommand + Handler
- [ ] RecordGoodsReceiptCommand + Handler (triggers 3-way match)
- [ ] ProcessVendorInvoiceCommand + Handler
- [ ] GetProcurementAnalyticsQuery (spend by category, vendor, campus)

Frontend:
- [ ] ProcurementPage.tsx — tabs: Requisitions, Purchase Orders, Vendors, GRN
- [ ] VendorRegistryPage.tsx

## MODULE CHECK 9: Assets & Inventory (FR-AST-01 to FR-AST-09)
Backend:
- [ ] RegisterAssetCommand + Handler (auto-generates AssetCode)
- [ ] UpdateAssetStatusCommand + Handler
- [ ] CalculateDepreciationCommand + Handler (straight-line + reducing balance)
- [ ] AllocateAssetCommand + Handler
- [ ] TransferAssetCommand + Handler (between campuses)
- [ ] GetAssetsQuery + Handler + AssetDto
- [ ] GetAssetAnalyticsQuery

Frontend:
- [ ] AssetsPage.tsx — searchable asset registry table
- [ ] AssetDetailPage.tsx — lifecycle timeline, maintenance history

## CROSS-CUTTING FEATURES (FR-PLT-01 to FR-PLT-10)
- [ ] AI Chatbot Widget (floating bottom-right, calls /api/v1/chatbot/message)
- [ ] Notification Bell (SignalR, shows unread count badge)
- [ ] NotificationsPanel.tsx (slide-in panel with notification list)
- [ ] Offline Attendance (IndexedDB + Background Sync — PARTIALLY DONE, fix the 400)
- [ ] PDF Download buttons (grade cards, payslips, receipts, admit cards)
- [ ] Excel Export buttons (attendance reports, fee reports, payroll)

---

# PART 5 — CAMPUS DATA MODEL FIX

The system has 32 campuses: 1 Main HQ + 31 sub-campuses.

## 5.1 Update Campus entity seeding

In `DbSeeder.cs`, ensure these campuses exist:
```csharp
// Main HQ Campus
new Campus { Name = "Falcon College — Main Campus (HQ)", Code = "FC-HQ", City = "Karachi", IsMainCampus = true, IsActive = true }

// 31 Sub-campuses
new Campus { Name = "Falcon College — North Campus", Code = "FC-01", City = "Karachi", IsMainCampus = false }
new Campus { Name = "Falcon College — South Campus", Code = "FC-02", City = "Karachi", IsMainCampus = false }
// ... generate FC-03 through FC-31 with realistic names and cities
```

## 5.2 Add IsMainCampus field

In `Campus.cs` entity:
```csharp
public bool IsMainCampus { get; set; }  // true = HQ, false = sub-campus
```

In the Super Admin portal, show:
- "Main Campus (HQ)" first in campus list
- Campus selector dropdown groups: "HQ" and "Sub-Campuses"
- Cross-campus reports aggregate all 32

---

# PART 6 — UI/UX STANDARDS

Apply these standards across ALL four portals:

## 6.1 Color System
```css
/* Super Admin Portal */
--sidebar-bg: #0F1B2D;
--sidebar-text: #E8EDF5;
--accent: #E53E3E; /* red for super admin */

/* Campus Portal */
--sidebar-bg: #1B4F8A;
--sidebar-text: #FFFFFF;
--accent: #2E75B6;

/* Teacher Portal */
--sidebar-bg: #1E3A5F;
--sidebar-text: #FFFFFF;
--accent: #3182CE;

/* Student Portal */
--sidebar-bg: #2D3748;
--sidebar-text: #FFFFFF;
--accent: #48BB78; /* green for student */
```

## 6.2 Component Standards
Every page must have:
- Loading skeleton (not spinner) while data loads
- Empty state with icon + message when no data
- Error state with retry button when API fails
- Toast notifications for success/error actions (react-hot-toast)

Every table must have:
- Column headers
- Pagination (15 rows default)
- Search input (debounced 300ms)
- Export button (CSV/Excel)

Every form must have:
- React Hook Form + Zod validation
- Real-time validation feedback
- Disabled submit button while loading
- Success/error toast on submit

## 6.3 Responsive Design
- Sidebar collapses to icon-only on screens < 1024px
- Tables become scrollable horizontally on mobile
- Attendance page is TABLET-FIRST (large touch targets, 48px minimum)

---

# PART 7 — FINAL VERIFICATION CHECKLIST

After all changes, verify:

### Backend:
```powershell
dotnet build D:\FAMS\src\FAMS\FAMS.sln
# Must show: Build succeeded. 0 Error(s)

curl http://localhost:5000/health
# Must return: {"status":"healthy"}

curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fams.local","password":"Admin@12345!"}'
# Must return: {"isSuccess":true,"value":{"accessToken":"..."}}
```

### Frontend:
```powershell
cd frontend
npx tsc --noEmit
# Must show: 0 errors

npm run build
# Must complete successfully
```

### Portal verification:
- [ ] Login as admin@fams.local → redirects to SUPER ADMIN portal
- [ ] Super admin dashboard shows ALL 32 campuses
- [ ] Can switch campus scope in super admin
- [ ] Campus portal shows only campus-scoped data
- [ ] Teacher portal shows only own classes and marks entry
- [ ] Student portal shows only own data
- [ ] Attendance page: mark attendance → no 400 error
- [ ] HRM page: loads without toFixed crash
- [ ] All 8 module pages accessible from campus portal nav
- [ ] AI chatbot widget visible and responds
- [ ] Offline attendance: turn off wifi → banner shows → marks saved → turn on wifi → auto syncs

### API endpoint checklist (all must return 200 with auth token):
```
GET  /api/v1/dashboard/principal
GET  /api/v1/students
GET  /api/v1/admissions/applications
GET  /api/v1/attendance/report
GET  /api/v1/timetable/section/{id}
GET  /api/v1/results/analytics
GET  /api/v1/fee/invoices
GET  /api/v1/payroll/summary
GET  /api/v1/hrm/staff
GET  /api/v1/procurement/requisition
GET  /api/v1/assets
GET  /api/v1/chatbot/message (POST)
```

---

# DELIVERY SUMMARY

When done, give me a report:
```
BUGS FIXED:
- HRM toFixed crash: ✅/❌
- Attendance 400 error: ✅/❌
- WebSocket noise: ✅/❌

PORTALS COMPLETED:
- Super Admin Portal: ✅/❌
- Campus Head Portal: ✅/❌
- Teacher Portal: ✅/❌
- Student Portal: ✅/❌

MODULES COMPLETED:
- CRM: ✅/❌
- Admissions: ✅/❌
- Academic (Timetable+Attendance+Exams): ✅/❌
- Results: ✅/❌
- Finance (Fee+Payroll): ✅/❌
- HRM: ✅/❌
- Procurement: ✅/❌
- Assets: ✅/❌
- Cross-cutting (Chatbot+Notifications+Offline): ✅/❌

CAMPUS DATA:
- 32 campuses seeded (1 HQ + 31 sub): ✅/❌
- Super admin sees all 32: ✅/❌
- Campus portal scoped correctly: ✅/❌

BUILD STATUS:
- dotnet build: 0 errors ✅/❌
- tsc --noEmit: 0 errors ✅/❌
- npm run build: success ✅/❌
```

Start with Part 1 (bug fixes), then Part 2-4 (portals + modules), then Part 5-7 (campus data + UI + verification). Do not skip anything.
