import { useState } from 'react'
import { cn } from '../../lib/utils'

type Tab = 'academic' | 'fees' | 'grading' | 'notifications'

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'academic',      label: 'Academic Years',     icon: '🗓️' },
  { id: 'fees',          label: 'Fee Templates',      icon: '💰' },
  { id: 'grading',       label: 'Grading Scales',     icon: '📊' },
  { id: 'notifications', label: 'Notifications',      icon: '🔔' },
]

export default function SystemConfigPage() {
  const [tab, setTab] = useState<Tab>('academic')

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">System Configuration</h1>
      <p className="text-sm text-muted-foreground mb-6">Institution-wide settings applied across all campuses.</p>

      <div className="border-b border-border mb-4 flex flex-wrap gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'px-4 py-2 text-sm border-b-2 -mb-px transition-colors',
              tab === t.id
                ? 'border-primary-700 text-primary-700 font-semibold'
                : 'border-transparent text-gray-600 hover:text-primary-700',
            )}
          >
            <span className="mr-2">{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-border p-6">
        {tab === 'academic' && <AcademicTab />}
        {tab === 'fees' && <FeeTemplatesTab />}
        {tab === 'grading' && <GradingScalesTab />}
        {tab === 'notifications' && <NotificationsTab />}
      </div>
    </div>
  )
}

function AcademicTab() {
  return (
    <div>
      <h2 className="font-semibold text-gray-900 mb-2">Academic Calendar</h2>
      <p className="text-sm text-muted-foreground mb-4">Define academic years, terms, and holiday dates per campus.</p>
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-3 py-2 font-semibold text-gray-700">Term</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-700">Start</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-700">End</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-700">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border">
            <td className="px-3 py-2">Spring 2026</td>
            <td className="px-3 py-2">2026-02-01</td>
            <td className="px-3 py-2">2026-06-30</td>
            <td className="px-3 py-2"><span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs">Active</span></td>
          </tr>
          <tr className="border-b border-border">
            <td className="px-3 py-2">Fall 2026</td>
            <td className="px-3 py-2">2026-08-15</td>
            <td className="px-3 py-2">2026-12-15</td>
            <td className="px-3 py-2"><span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">Upcoming</span></td>
          </tr>
        </tbody>
      </table>
      <p className="text-xs text-muted-foreground mt-3 italic">
        Term &amp; holiday CRUD will be wired to the backend in Sprint C (FR-TT-05).
      </p>
    </div>
  )
}

function FeeTemplatesTab() {
  return (
    <div>
      <h2 className="font-semibold text-gray-900 mb-2">Fee Structure Templates</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Per-program fee heads applied when invoices are generated for a term.
      </p>
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-3 py-2 font-semibold text-gray-700">Program</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-700">Tuition</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-700">Lab</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-700">Library</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-700">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border">
            <td className="px-3 py-2">Primary</td>
            <td className="px-3 py-2">PKR 12,000</td>
            <td className="px-3 py-2">—</td>
            <td className="px-3 py-2">PKR 1,000</td>
            <td className="px-3 py-2 font-semibold">PKR 13,000</td>
          </tr>
          <tr className="border-b border-border">
            <td className="px-3 py-2">Secondary</td>
            <td className="px-3 py-2">PKR 16,000</td>
            <td className="px-3 py-2">PKR 2,000</td>
            <td className="px-3 py-2">PKR 1,500</td>
            <td className="px-3 py-2 font-semibold">PKR 19,500</td>
          </tr>
          <tr className="border-b border-border">
            <td className="px-3 py-2">Higher Secondary</td>
            <td className="px-3 py-2">PKR 22,000</td>
            <td className="px-3 py-2">PKR 3,000</td>
            <td className="px-3 py-2">PKR 1,500</td>
            <td className="px-3 py-2 font-semibold">PKR 26,500</td>
          </tr>
        </tbody>
      </table>
      <p className="text-xs text-muted-foreground mt-3 italic">
        Backed `FeeStructure` entity + invoice generator integration is in Sprint D (FR-FEE-01).
      </p>
    </div>
  )
}

function GradingScalesTab() {
  return (
    <div>
      <h2 className="font-semibold text-gray-900 mb-2">Grading Scale</h2>
      <p className="text-sm text-muted-foreground mb-4">Percentage-to-grade rules applied when marks are saved.</p>
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-3 py-2 font-semibold text-gray-700">Grade</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-700">Min %</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-700">Max %</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-700">GPA</th>
          </tr>
        </thead>
        <tbody>
          {[
            { g: 'A+', min: 90, max: 100, gpa: 4.0 },
            { g: 'A',  min: 80, max: 89,  gpa: 3.7 },
            { g: 'B+', min: 75, max: 79,  gpa: 3.3 },
            { g: 'B',  min: 70, max: 74,  gpa: 3.0 },
            { g: 'C',  min: 60, max: 69,  gpa: 2.5 },
            { g: 'D',  min: 50, max: 59,  gpa: 2.0 },
            { g: 'F',  min: 0,  max: 49,  gpa: 0.0 },
          ].map((r) => (
            <tr key={r.g} className="border-b border-border">
              <td className="px-3 py-2 font-semibold">{r.g}</td>
              <td className="px-3 py-2">{r.min}</td>
              <td className="px-3 py-2">{r.max}</td>
              <td className="px-3 py-2">{r.gpa.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-muted-foreground mt-3 italic">
        Persisted &amp; per-program `GradingScale` config is in Sprint C (FR-RES-02).
      </p>
    </div>
  )
}

function NotificationsTab() {
  return (
    <div>
      <h2 className="font-semibold text-gray-900 mb-2">Notification Templates</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Channels and message templates fired by the dispatcher when system events occur.
      </p>
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-3 py-2 font-semibold text-gray-700">Event</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-700">Channels</th>
            <th className="text-left px-3 py-2 font-semibold text-gray-700">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border">
            <td className="px-3 py-2">Student marked absent</td>
            <td className="px-3 py-2">SMS, In-App</td>
            <td className="px-3 py-2"><span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs">Live</span></td>
          </tr>
          <tr className="border-b border-border">
            <td className="px-3 py-2">Results published</td>
            <td className="px-3 py-2">SMS, Email</td>
            <td className="px-3 py-2"><span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs">Live</span></td>
          </tr>
          <tr className="border-b border-border">
            <td className="px-3 py-2">Fee due reminder (T-7)</td>
            <td className="px-3 py-2">SMS</td>
            <td className="px-3 py-2"><span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">Sprint D</span></td>
          </tr>
          <tr className="border-b border-border">
            <td className="px-3 py-2">Application status changed</td>
            <td className="px-3 py-2">Email</td>
            <td className="px-3 py-2"><span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">Sprint C</span></td>
          </tr>
        </tbody>
      </table>
      <p className="text-xs text-muted-foreground mt-3 italic">
        Powered by MediatR <code>INotification</code> dispatcher. Channels are pluggable via
        <code> INotificationHandler&lt;TEvent&gt;</code> handlers.
      </p>
    </div>
  )
}
