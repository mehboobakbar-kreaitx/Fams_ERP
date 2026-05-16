import { Link } from 'react-router-dom'
import { authStore } from '../../store/authStore'
import KpiCard from '../../components/ui/KpiCard'

export default function TeacherDashboard() {
  const { user } = authStore.getState()
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900">Welcome, {user?.firstName || 'Teacher'}!</h2>
      <p className="text-sm text-muted-foreground mb-6">Quick links to your daily work.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Classes Today" value="—" icon="🗓️" />
        <KpiCard label="Pending Attendance" value="—" icon="✅" />
        <KpiCard label="Marks to Enter" value="—" icon="📊" />
        <KpiCard label="Leave Balance" value="—" icon="🌴" />
      </div>

      <div className="bg-white rounded-xl border border-border p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Quick actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link to="/teacher/attendance" className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm">Mark Attendance</Link>
          <Link to="/teacher/marks" className="bg-secondary hover:opacity-90 text-white px-4 py-2 rounded-lg text-sm">Enter Marks</Link>
          <Link to="/teacher/leave" className="border border-border hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm">Apply for Leave</Link>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        Teacher-specific schedule, classes, and marks-entry features will be filled in as part of Sprint C.
      </p>
    </div>
  )
}
