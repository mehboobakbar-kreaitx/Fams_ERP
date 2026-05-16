import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { authStore } from './store/authStore'
import { landingPath, resolvePortal } from './components/auth/rolePortal'

const Login = lazy(() => import('./pages/Login'))
const PublicApplyPage = lazy(() => import('./pages/PublicApplyPage'))

// Layouts
const SuperAdminLayout = lazy(() => import('./components/layout/SuperAdminLayout'))
const CampusLayout     = lazy(() => import('./components/layout/CampusLayout'))
const TeacherLayout    = lazy(() => import('./components/layout/TeacherLayout'))
const StudentLayout    = lazy(() => import('./components/layout/StudentLayout'))
const ParentLayout     = lazy(() => import('./components/layout/ParentLayout'))

// Campus setup (first-time School Admin flow — no layout wrapper)
const CampusSetupPage = lazy(() => import('./pages/campus/CampusSetupPage'))

// Campus portal pages (existing)
const Dashboard          = lazy(() => import('./pages/Dashboard'))
const StudentsPage       = lazy(() => import('./pages/StudentsPage'))
const StudentDetailPage  = lazy(() => import('./pages/StudentDetailPage'))
const AttendancePage     = lazy(() => import('./pages/AttendancePage'))
const FeePage            = lazy(() => import('./pages/FeePage'))
const AdmissionsPage     = lazy(() => import('./pages/AdmissionsPage'))
const ResultsPage        = lazy(() => import('./pages/ResultsPage'))
const HrmPage            = lazy(() => import('./pages/HrmPage'))

// Super Admin portal pages
const SuperAdminDashboard = lazy(() => import('./pages/superadmin/SuperAdminDashboard'))
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

export default function App() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center text-primary-700">Loading…</div>
        }
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/apply" element={<PublicApplyPage />} />
          <Route path="/campus/setup" element={<CampusSetupPage />} />
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
            <Route path="/super-admin/finance"   element={<InstitutionFinancePage />} />
            <Route path="/super-admin/audit"     element={<AuditLogPage />} />
            <Route path="/super-admin/config"    element={<SystemConfigPage />} />
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
            <Route path="/campus/attendance"   element={<AttendancePage />} />
            <Route path="/campus/results"      element={<ResultsPage />} />
            <Route path="/campus/fee"          element={<FeePage />} />
            <Route path="/campus/hrm"          element={<HrmPage />} />
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
