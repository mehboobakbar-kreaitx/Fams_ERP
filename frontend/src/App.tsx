import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { authStore } from './store/authStore'
import { landingPath, resolvePortal } from './components/auth/rolePortal'

const Login = lazy(() => import('./pages/Login'))
const MfaSetupPage = lazy(() => import('./pages/mfa/MfaSetupPage'))
const MfaVerifyPage = lazy(() => import('./pages/mfa/MfaVerifyPage'))
const PublicApplyPage = lazy(() => import('./pages/PublicApplyPage'))
const Placeholder = lazy(() => import('./pages/Placeholder'))

// Layouts
const SuperAdminLayout  = lazy(() => import('./components/layout/SuperAdminLayout'))
const ExecutiveLayout   = lazy(() => import('./components/layout/ExecutiveLayout'))
const CampusLayout      = lazy(() => import('./components/layout/CampusLayout'))
const TeacherLayout     = lazy(() => import('./components/layout/TeacherLayout'))
const StudentLayout     = lazy(() => import('./components/layout/StudentLayout'))
const ParentLayout      = lazy(() => import('./components/layout/ParentLayout'))

// Campus setup (first-time School Admin flow — no layout wrapper)
const CampusSetupPage = lazy(() => import('./pages/campus/CampusSetupPage'))

// Campus academic management pages
const ClassesPage      = lazy(() => import('./pages/campus/ClassesPage'))
const ExaminationsPage = lazy(() => import('./pages/campus/ExaminationsPage'))
const CertificatesPage = lazy(() => import('./pages/campus/CertificatesPage'))

// Campus portal pages (existing)
const Dashboard          = lazy(() => import('./pages/Dashboard'))
const StudentsPage       = lazy(() => import('./pages/StudentsPage'))
const StudentDetailPage  = lazy(() => import('./pages/StudentDetailPage'))
const AttendancePage     = lazy(() => import('./pages/AttendancePage'))
const FeePage            = lazy(() => import('./pages/FeePage'))
const AdmissionsPage     = lazy(() => import('./pages/AdmissionsPage'))
const ResultsPage        = lazy(() => import('./pages/ResultsPage'))
const HrmPage            = lazy(() => import('./pages/HrmPage'))

// Finance sub-module pages
const FinanceDashboard        = lazy(() => import('./pages/finance/FinanceDashboard'))
const FeeStructuresPage       = lazy(() => import('./pages/finance/FeeStructuresPage'))
const PaymentsPage            = lazy(() => import('./pages/finance/PaymentsPage'))
const BudgetingPage           = lazy(() => import('./pages/finance/BudgetingPage'))
const ExpenseTrackingPage     = lazy(() => import('./pages/finance/ExpenseTrackingPage'))
const PayrollFinancePage      = lazy(() => import('./pages/finance/PayrollFinancePage'))
const SalaryExpensesPage      = lazy(() => import('./pages/finance/SalaryExpensesPage'))
const PayrollLedgerPage       = lazy(() => import('./pages/finance/PayrollLedgerPage'))
const FinancialReportsPage    = lazy(() => import('./pages/finance/FinancialReportsPage'))

// Payroll sub-module pages
const PayrollDashboard       = lazy(() => import('./pages/payroll/PayrollDashboard'))
const SalaryStructuresPage   = lazy(() => import('./pages/payroll/SalaryStructuresPage'))
const SalaryGradesPage       = lazy(() => import('./pages/payroll/SalaryGradesPage'))
const PayrollProcessingPage  = lazy(() => import('./pages/payroll/PayrollProcessingPage'))
const BonusesPage            = lazy(() => import('./pages/payroll/BonusesPage'))
const DeductionsPage         = lazy(() => import('./pages/payroll/DeductionsPage'))
const OvertimePage           = lazy(() => import('./pages/payroll/OvertimePage'))
const TaxesPage              = lazy(() => import('./pages/payroll/TaxesPage'))
const PayslipsPage           = lazy(() => import('./pages/payroll/PayslipsPage'))
const PayrollReportsPage     = lazy(() => import('./pages/payroll/PayrollReportsPage'))
const PayrollAuditPage       = lazy(() => import('./pages/payroll/PayrollAuditPage'))

// Operational module pages
const TransportPage        = lazy(() => import('./pages/transport/TransportPage'))
const LibraryPage          = lazy(() => import('./pages/library/LibraryPage'))
const HostelPage           = lazy(() => import('./pages/hostel/HostelPage'))
const NotificationsPage    = lazy(() => import('./pages/communications/NotificationsPage'))
const MessagingPage        = lazy(() => import('./pages/communications/MessagingPage'))
const SupportTicketsPage   = lazy(() => import('./pages/communications/SupportTicketsPage'))

// Security & Compliance pages
const SecurityDashboard      = lazy(() => import('./pages/security/SecurityDashboard'))
const RolesPermissionsPage   = lazy(() => import('./pages/security/RolesPermissionsPage'))
const MfaManagementPage      = lazy(() => import('./pages/security/MfaManagementPage'))
const ActivityMonitorPage    = lazy(() => import('./pages/security/ActivityMonitorPage'))
const ComplianceLogsPage     = lazy(() => import('./pages/security/ComplianceLogsPage'))

// Reports & Analytics pages
const ReportsDashboard       = lazy(() => import('./pages/reports/ReportsDashboard'))
const AcademicReportsPage    = lazy(() => import('./pages/reports/AcademicReportsPage'))
const AttendanceReportsPage  = lazy(() => import('./pages/reports/AttendanceReportsPage'))
const CampusKpiPage          = lazy(() => import('./pages/reports/CampusKpiPage'))
const CrossCampusPage        = lazy(() => import('./pages/reports/CrossCampusPage'))
const OperationalReportsPage = lazy(() => import('./pages/reports/OperationalReportsPage'))

// Asset & Inventory sub-module pages
const AssetDashboard      = lazy(() => import('./pages/assets/AssetDashboard'))
const AssetRegistryPage   = lazy(() => import('./pages/assets/AssetRegistryPage'))
const AssetAssignmentPage = lazy(() => import('./pages/assets/AssetAssignmentPage'))
const MaintenancePage     = lazy(() => import('./pages/assets/MaintenancePage'))
const DepreciationPage    = lazy(() => import('./pages/assets/DepreciationPage'))
const InventoryStockPage  = lazy(() => import('./pages/assets/InventoryStockPage'))
const TransfersPage       = lazy(() => import('./pages/assets/TransfersPage'))
const AssetAuditPage      = lazy(() => import('./pages/assets/AssetAuditPage'))

// Procurement sub-module pages
const ProcurementDashboard    = lazy(() => import('./pages/procurement/ProcurementDashboard'))
const VendorsPage             = lazy(() => import('./pages/procurement/VendorsPage'))
const PurchaseRequestsPage    = lazy(() => import('./pages/procurement/PurchaseRequestsPage'))
const QuotationsPage          = lazy(() => import('./pages/procurement/QuotationsPage'))
const PurchaseOrdersPage      = lazy(() => import('./pages/procurement/PurchaseOrdersPage'))
const ProcurementApprovalsPage = lazy(() => import('./pages/procurement/ApprovalsPage'))
const GoodsReceivingPage      = lazy(() => import('./pages/procurement/GoodsReceivingPage'))
const ProcurementReportsPage  = lazy(() => import('./pages/procurement/ProcurementReportsPage'))

// HRM sub-module pages
const HrmDepartmentsPage    = lazy(() => import('./pages/hrm/DepartmentsPage'))
const HrmRecruitmentPage    = lazy(() => import('./pages/hrm/RecruitmentPage'))
const HrmLeaveManagementPage = lazy(() => import('./pages/hrm/LeaveManagementPage'))
const HrmStaffAttendancePage = lazy(() => import('./pages/hrm/StaffAttendancePage'))
const HrmContractsPage      = lazy(() => import('./pages/hrm/ContractsPage'))
const HrmPerformancePage    = lazy(() => import('./pages/hrm/PerformancePage'))
const HrmBenefitsPage       = lazy(() => import('./pages/hrm/BenefitsPage'))
const HrmResignationsPage   = lazy(() => import('./pages/hrm/ResignationsPage'))
const HrmReportsPage        = lazy(() => import('./pages/hrm/HrmReportsPage'))

// Super Admin portal pages
const SuperAdminDashboard = lazy(() => import('./pages/superadmin/SuperAdminDashboard'))
const SubscriptionPage    = lazy(() => import('./pages/superadmin/SubscriptionPage'))
const SchoolsPage         = lazy(() => import('./pages/superadmin/SchoolsPage'))
const CampusesPage        = lazy(() => import('./pages/superadmin/CampusesPage'))
const SystemConfigPage    = lazy(() => import('./pages/superadmin/SystemConfigPage'))
const StaffPage           = lazy(() => import('./pages/superadmin/StaffPage'))
const InstitutionFinancePage = lazy(() => import('./pages/superadmin/FinancePage'))
const AuditLogPage        = lazy(() => import('./pages/superadmin/AuditLogPage'))

// Teacher portal pages
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'))
const TeacherSchedulePage = lazy(() => import('./pages/teacher/SchedulePage'))
const TeacherMarksPage    = lazy(() => import('./pages/teacher/MarksPage'))
const TeacherLeavePage    = lazy(() => import('./pages/teacher/LeavePage'))

// Student portal pages
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'))
const StudentTimetablePage  = lazy(() => import('./pages/student/TimetablePage'))
const StudentAttendancePage = lazy(() => import('./pages/student/MyAttendancePage'))
const StudentResultsPage    = lazy(() => import('./pages/student/MyResultsPage'))
const StudentFeePage        = lazy(() => import('./pages/student/MyFeePage'))
const StudentDocumentsPage  = lazy(() => import('./pages/student/DocumentsPage'))

// Parent portal pages
const ParentDashboard          = lazy(() => import('./pages/parent/ParentDashboard'))
const ParentChildrenPage       = lazy(() => import('./pages/parent/ParentChildrenPage'))
const ParentChildDetailPage    = lazy(() => import('./pages/parent/ParentChildDetailPage'))
const ParentAttendancePage     = lazy(() => import('./pages/parent/ParentAttendancePage'))
const ParentResultsPage        = lazy(() => import('./pages/parent/ParentResultsPage'))
const ParentFeePage            = lazy(() => import('./pages/parent/ParentFeePage'))
const ParentCommunicationsPage = lazy(() => import('./pages/parent/ParentCommunicationsPage'))

function RootRedirect() {
  if (!authStore.isAuthenticated()) return <Navigate to="/login" replace />
  const { user } = authStore.getState()
  const portal = resolvePortal(user?.roles)
  return <Navigate to={landingPath(portal)} replace />
}

// Redirects already-authenticated users away from /login, and users in the
// mfa_pending phase to the correct MFA page.
function LoginGuard({ children }: { children: React.ReactNode }) {
  const phase = authStore.getAuthPhase()
  if (phase === 'authenticated') return <RootRedirect />
  if (phase === 'mfa_pending') {
    const p = authStore.getPendingMfa()!
    return <Navigate to={p.mfaEnrollmentRequired ? '/mfa/setup' : '/mfa/verify'} replace />
  }
  return <>{children}</>
}

// Guards /mfa/setup and /mfa/verify: authenticated → dashboard, anonymous → login,
// wrong MFA step → correct MFA step.
function MfaRouteGuard({ enrollment, children }: { enrollment: boolean; children: React.ReactNode }) {
  const phase = authStore.getAuthPhase()
  if (phase === 'authenticated') return <RootRedirect />
  if (phase === 'anonymous') return <Navigate to="/login" replace />
  const p = authStore.getPendingMfa()
  // Safety: phase is mfa_pending but localStorage entry is missing/corrupted.
  if (!p) return <Navigate to="/login" replace />
  if (enrollment && !p.mfaEnrollmentRequired) return <Navigate to="/mfa/verify" replace />
  if (!enrollment && p.mfaEnrollmentRequired) return <Navigate to="/mfa/setup" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center text-primary-700">Loading…</div>
        }
      >
        <Routes>
          <Route path="/login" element={<LoginGuard><Login /></LoginGuard>} />
          <Route path="/mfa/setup" element={<MfaRouteGuard enrollment={true}><MfaSetupPage /></MfaRouteGuard>} />
          <Route path="/mfa/verify" element={<MfaRouteGuard enrollment={false}><MfaVerifyPage /></MfaRouteGuard>} />
          <Route path="/apply" element={<PublicApplyPage />} />
          <Route path="/campus/setup" element={
            <ProtectedRoute roles={['Principal', 'AcademicCoordinator', 'Accountant', 'HrOfficer', 'ProcurementOfficer']}>
              <CampusSetupPage />
            </ProtectedRoute>
          } />
          <Route
            path="/unauthorized"
            element={
              <div className="flex h-screen items-center justify-center text-red-600">Access Denied</div>
            }
          />

          {/* Super Admin Portal — SystemAdmin only */}
          <Route
            element={
              <ProtectedRoute roles={['SystemAdmin']}>
                <SuperAdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/super-admin" element={<Navigate to="/super-admin/dashboard" replace />} />
            <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/schools"   element={<SchoolsPage />} />
            <Route path="/super-admin/campuses"  element={<CampusesPage />} />
            <Route path="/super-admin/students"  element={<StudentsPage />} />
            <Route path="/super-admin/staff"     element={<StaffPage />} />
            <Route path="/super-admin/finance"         element={<InstitutionFinancePage />} />
            <Route path="/super-admin/subscriptions"   element={<SubscriptionPage />} />
            <Route path="/super-admin/audit"     element={<AuditLogPage />} />
            <Route path="/super-admin/config"    element={<SystemConfigPage />} />
            {/* Academic Management placeholders */}
            <Route path="/super-admin/classes"      element={<Placeholder title="Classes & Sections" />} />
            <Route path="/super-admin/exams"        element={<Placeholder title="Examinations" />} />
            <Route path="/super-admin/certificates" element={<Placeholder title="Certificates" />} />
            {/* New module placeholders — will be implemented in future sprints */}
            <Route path="/super-admin/payroll"          element={<PayrollDashboard />} />
            <Route path="/super-admin/finance/reports"   element={<FinancialReportsPage />} />
            <Route path="/super-admin/procurement"              element={<ProcurementDashboard />} />
            <Route path="/super-admin/procurement/vendors"     element={<VendorsPage />} />
            <Route path="/super-admin/procurement/requests"    element={<PurchaseRequestsPage />} />
            <Route path="/super-admin/procurement/orders"      element={<PurchaseOrdersPage />} />
            <Route path="/super-admin/procurement/reports"     element={<ProcurementReportsPage />} />
            <Route path="/super-admin/assets"               element={<AssetDashboard />} />
            <Route path="/super-admin/assets/registry"     element={<AssetRegistryPage />} />
            <Route path="/super-admin/assets/inventory"    element={<InventoryStockPage />} />
            <Route path="/super-admin/assets/transfers"    element={<TransfersPage />} />
            <Route path="/super-admin/assets/audit"        element={<AssetAuditPage />} />
            <Route path="/super-admin/transport"      element={<TransportPage />} />
            <Route path="/super-admin/library"       element={<LibraryPage />} />
            <Route path="/super-admin/hostel"        element={<HostelPage />} />
            <Route path="/super-admin/crm"           element={<NotificationsPage />} />
            <Route path="/super-admin/notifications" element={<NotificationsPage />} />
            <Route path="/super-admin/messaging"     element={<MessagingPage />} />
            <Route path="/super-admin/support"       element={<SupportTicketsPage />} />
            {/* Security & Compliance */}
            <Route path="/super-admin/security"                  element={<SecurityDashboard />} />
            <Route path="/super-admin/security/roles"            element={<RolesPermissionsPage />} />
            <Route path="/super-admin/security/mfa"              element={<MfaManagementPage />} />
            <Route path="/super-admin/security/activity"         element={<ActivityMonitorPage />} />
            <Route path="/super-admin/security/compliance"       element={<ComplianceLogsPage />} />
            <Route path="/super-admin/reports"                  element={<ReportsDashboard />} />
            <Route path="/super-admin/reports/academic"        element={<AcademicReportsPage />} />
            <Route path="/super-admin/reports/attendance"      element={<AttendanceReportsPage />} />
            <Route path="/super-admin/reports/campus-kpi"      element={<CampusKpiPage />} />
            <Route path="/super-admin/reports/cross-campus"    element={<CrossCampusPage />} />
            <Route path="/super-admin/reports/operational"     element={<OperationalReportsPage />} />
          </Route>

          {/* Executive Portal — Executive only */}
          <Route
            element={
              <ProtectedRoute roles={['Executive']}>
                <ExecutiveLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/executive" element={<Navigate to="/executive/dashboard" replace />} />
            <Route path="/executive/dashboard"                element={<SuperAdminDashboard />} />
            <Route path="/executive/reports"                  element={<ReportsDashboard />} />
            <Route path="/executive/reports/cross-campus"     element={<CrossCampusPage />} />
            <Route path="/executive/reports/campus-kpi"       element={<CampusKpiPage />} />
            <Route path="/executive/reports/academic"         element={<AcademicReportsPage />} />
            <Route path="/executive/reports/attendance"       element={<AttendanceReportsPage />} />
            <Route path="/executive/reports/operational"      element={<OperationalReportsPage />} />
          </Route>

          {/* Campus Portal — Principal, Accountant, HrOfficer, ProcurementOfficer, AcademicCoordinator */}
          <Route
            element={
              <ProtectedRoute
                roles={['Principal', 'Accountant', 'HrOfficer', 'ProcurementOfficer', 'AcademicCoordinator']}
              >
                <CampusLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/campus" element={<Navigate to="/campus/dashboard" replace />} />
            <Route path="/campus/dashboard"    element={<Dashboard />} />
            <Route path="/campus/students"     element={<StudentsPage />} />
            <Route path="/campus/students/:id" element={<StudentDetailPage />} />
            <Route path="/campus/admissions"   element={<AdmissionsPage />} />
            <Route path="/campus/classes"      element={<ClassesPage />} />
            <Route path="/campus/attendance"   element={<AttendancePage />} />
            <Route path="/campus/exams"        element={<ExaminationsPage />} />
            <Route path="/campus/results"      element={<ResultsPage />} />
            <Route path="/campus/certificates" element={<CertificatesPage />} />
            <Route path="/campus/fee"          element={<FeePage />} />
            <Route path="/campus/hrm"                    element={<HrmPage />} />
            <Route path="/campus/hrm/departments"        element={<HrmDepartmentsPage />} />
            <Route path="/campus/hrm/recruitment"        element={<HrmRecruitmentPage />} />
            <Route path="/campus/hrm/leaves"             element={<HrmLeaveManagementPage />} />
            <Route path="/campus/hrm/staff-attendance"   element={<HrmStaffAttendancePage />} />
            <Route path="/campus/hrm/contracts"          element={<HrmContractsPage />} />
            <Route path="/campus/hrm/performance"        element={<HrmPerformancePage />} />
            <Route path="/campus/hrm/benefits"           element={<HrmBenefitsPage />} />
            <Route path="/campus/hrm/resignations"       element={<HrmResignationsPage />} />
            <Route path="/campus/hrm/reports"            element={<HrmReportsPage />} />
            {/* Finance & Accounting sub-modules */}
            <Route path="/campus/finance"                    element={<FinanceDashboard />} />
            <Route path="/campus/finance/fee-structures"     element={<FeeStructuresPage />} />
            <Route path="/campus/finance/payments"           element={<PaymentsPage />} />
            <Route path="/campus/finance/budget"             element={<BudgetingPage />} />
            <Route path="/campus/finance/expenses"           element={<ExpenseTrackingPage />} />
            <Route path="/campus/finance/payroll-summary"    element={<PayrollFinancePage />} />
            <Route path="/campus/finance/salary-expenses"    element={<SalaryExpensesPage />} />
            <Route path="/campus/finance/payroll-ledger"     element={<PayrollLedgerPage />} />
            <Route path="/campus/finance/reports"            element={<FinancialReportsPage />} />
            {/* Payroll & Salaries */}
            <Route path="/campus/payroll"                  element={<PayrollDashboard />} />
            <Route path="/campus/payroll/structures"       element={<SalaryStructuresPage />} />
            <Route path="/campus/payroll/grades"           element={<SalaryGradesPage />} />
            <Route path="/campus/payroll/processing"       element={<PayrollProcessingPage />} />
            <Route path="/campus/payroll/bonuses"          element={<BonusesPage />} />
            <Route path="/campus/payroll/deductions"       element={<DeductionsPage />} />
            <Route path="/campus/payroll/overtime"         element={<OvertimePage />} />
            <Route path="/campus/payroll/taxes"            element={<TaxesPage />} />
            <Route path="/campus/payroll/payslips"         element={<PayslipsPage />} />
            <Route path="/campus/payroll/reports"          element={<PayrollReportsPage />} />
            <Route path="/campus/payroll/audit"            element={<PayrollAuditPage />} />
            {/* Other module placeholders — will be implemented in future sprints */}
            {/* Vendor & Procurement */}
            <Route path="/campus/procurement"              element={<ProcurementDashboard />} />
            <Route path="/campus/procurement/vendors"      element={<VendorsPage />} />
            <Route path="/campus/procurement/requests"     element={<PurchaseRequestsPage />} />
            <Route path="/campus/procurement/quotations"   element={<QuotationsPage />} />
            <Route path="/campus/procurement/orders"       element={<PurchaseOrdersPage />} />
            <Route path="/campus/procurement/approvals"    element={<ProcurementApprovalsPage />} />
            <Route path="/campus/procurement/grn"          element={<GoodsReceivingPage />} />
            <Route path="/campus/procurement/reports"      element={<ProcurementReportsPage />} />
            {/* Asset & Inventory */}
            <Route path="/campus/assets"                element={<AssetDashboard />} />
            <Route path="/campus/assets/registry"       element={<AssetRegistryPage />} />
            <Route path="/campus/assets/assignments"    element={<AssetAssignmentPage />} />
            <Route path="/campus/assets/maintenance"    element={<MaintenancePage />} />
            <Route path="/campus/assets/depreciation"   element={<DepreciationPage />} />
            <Route path="/campus/assets/inventory"      element={<InventoryStockPage />} />
            <Route path="/campus/assets/transfers"      element={<TransfersPage />} />
            <Route path="/campus/assets/audit"          element={<AssetAuditPage />} />
            <Route path="/campus/transport"       element={<TransportPage />} />
            <Route path="/campus/library"        element={<LibraryPage />} />
            <Route path="/campus/hostel"         element={<HostelPage />} />
            <Route path="/campus/crm"            element={<NotificationsPage />} />
            <Route path="/campus/notifications"  element={<NotificationsPage />} />
            <Route path="/campus/messaging"      element={<MessagingPage />} />
            <Route path="/campus/support"        element={<SupportTicketsPage />} />
            <Route path="/campus/reports"                  element={<ReportsDashboard />} />
            <Route path="/campus/reports/academic"         element={<AcademicReportsPage />} />
            <Route path="/campus/reports/attendance"       element={<AttendanceReportsPage />} />
            <Route path="/campus/reports/campus-kpi"       element={<CampusKpiPage />} />
            <Route path="/campus/reports/operational"      element={<OperationalReportsPage />} />
          </Route>

          {/* Teacher Portal — Teacher, AcademicCoordinator */}
          <Route
            element={
              <ProtectedRoute roles={['Teacher', 'AcademicCoordinator']}>
                <TeacherLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/teacher" element={<Navigate to="/teacher/dashboard" replace />} />
            <Route path="/teacher/dashboard"  element={<TeacherDashboard />} />
            <Route path="/teacher/schedule"   element={<TeacherSchedulePage />} />
            <Route path="/teacher/attendance" element={<AttendancePage />} />
            <Route path="/teacher/students"   element={<StudentsPage />} />
            <Route path="/teacher/marks"      element={<TeacherMarksPage />} />
            <Route path="/teacher/exams"      element={<Placeholder title="Exam Schedule" />} />
            <Route path="/teacher/leave"      element={<TeacherLeavePage />} />
          </Route>

          {/* Parent Portal — Parent only */}
          <Route
            element={
              <ProtectedRoute roles={['Parent']}>
                <ParentLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/parent" element={<Navigate to="/parent/dashboard" replace />} />
            <Route path="/parent/dashboard"       element={<ParentDashboard />} />
            <Route path="/parent/children"        element={<ParentChildrenPage />} />
            <Route path="/parent/children/:id"    element={<ParentChildDetailPage />} />
            <Route path="/parent/attendance"      element={<ParentAttendancePage />} />
            <Route path="/parent/results"         element={<ParentResultsPage />} />
            <Route path="/parent/fee"             element={<ParentFeePage />} />
            <Route path="/parent/communications"  element={<ParentCommunicationsPage />} />
          </Route>

          {/* Student Portal — Student only */}
          <Route
            element={
              <ProtectedRoute roles={['Student']}>
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
            <Route path="/student/dashboard"  element={<StudentDashboard />} />
            <Route path="/student/timetable"  element={<StudentTimetablePage />} />
            <Route path="/student/attendance" element={<StudentAttendancePage />} />
            <Route path="/student/results"    element={<StudentResultsPage />} />
            <Route path="/student/fee"        element={<StudentFeePage />} />
            <Route path="/student/documents"  element={<StudentDocumentsPage />} />
          </Route>

          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
