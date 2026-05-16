import { Link } from 'react-router-dom'
import { authStore } from '../../store/authStore'
import KpiCard from '../../components/ui/KpiCard'

export default function StudentDashboard() {
  const { user } = authStore.getState()
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900">Hi {user?.firstName || 'there'}!</h2>
      <p className="text-sm text-muted-foreground mb-6">Your academic snapshot.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Attendance %" value="—" icon="📅" />
        <KpiCard label="Outstanding Fee" value="—" icon="💰" />
        <KpiCard label="Upcoming Exams" value="—" icon="📝" />
        <KpiCard label="Latest GPA" value="—" icon="📊" />
      </div>

      <div className="bg-white rounded-xl border border-border p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Where to next</h3>
        <div className="flex flex-wrap gap-3">
          <Link to="/student/timetable"  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm">View Timetable</Link>
          <Link to="/student/results"    className="bg-secondary hover:opacity-90 text-white px-4 py-2 rounded-lg text-sm">My Results</Link>
          <Link to="/student/fee"        className="border border-border hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm">Fee Statement</Link>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        Student-specific timetable, attendance calendar, results, fees, and documents are part of the
        Student Portal roadmap.
      </p>
    </div>
  )
}
