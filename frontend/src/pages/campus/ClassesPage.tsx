import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'

type ClassItem = {
  id: string
  name: string
  code: string
  programName?: string
  capacity: number
  sectionCount: number
  enrolledStudents: number
  isActive: boolean
}

type Section = {
  id: string
  name: string
  classId: string
  className: string
  teacherName?: string
  enrolledStudents: number
  capacity: number
}

type Summary = {
  totalClasses: number
  totalSections: number
  totalEnrolled: number
  averageOccupancy: number
}

export default function ClassesPage() {
  const [activeTab, setActiveTab] = useState<'classes' | 'sections'>('classes')

  const classesQuery = useQuery({
    queryKey: ['academic-classes'],
    queryFn: async () => {
      const res = await axiosClient.get<ClassItem[] | { items: ClassItem[] }>('/academic/classes')
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const sectionsQuery = useQuery({
    queryKey: ['academic-sections'],
    queryFn: async () => {
      const res = await axiosClient.get<Section[] | { items: Section[] }>('/academic/sections')
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const summaryQuery = useQuery({
    queryKey: ['academic-classes-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<Summary>('/academic/classes/summary')
      return res.data
    },
    retry: false,
  })

  const classes = classesQuery.data ?? []
  const sections = sectionsQuery.data ?? []
  const summary = summaryQuery.data

  const classColumns: Column<ClassItem>[] = [
    { key: 'name', header: 'Class Name', render: (r) => <span className="font-medium text-gray-900">{r.name}</span> },
    { key: 'code', header: 'Code', width: '100px' },
    { key: 'programName', header: 'Program', render: (r) => r.programName ?? '—' },
    { key: 'sectionCount', header: 'Sections', width: '90px' },
    { key: 'enrolledStudents', header: 'Enrolled', width: '90px' },
    {
      key: 'capacity',
      header: 'Capacity',
      width: '100px',
      render: (r) => (
        <span className={r.enrolledStudents >= r.capacity ? 'text-red-600 font-medium' : 'text-gray-700'}>
          {r.enrolledStudents}/{r.capacity}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      width: '90px',
      render: (r) => (
        <span
          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
            r.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {r.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ]

  const sectionColumns: Column<Section>[] = [
    { key: 'name', header: 'Section', render: (r) => <span className="font-medium text-gray-900">{r.name}</span> },
    { key: 'className', header: 'Class' },
    { key: 'teacherName', header: 'Class Teacher', render: (r) => r.teacherName ?? '—' },
    { key: 'enrolledStudents', header: 'Enrolled', width: '90px' },
    {
      key: 'capacity',
      header: 'Occupancy',
      width: '120px',
      render: (r) => {
        const pct = r.capacity > 0 ? Math.round((r.enrolledStudents / r.capacity) * 100) : 0
        const color = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-400' : 'bg-emerald-500'
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-[60px]">
              <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            <span className="text-xs text-gray-600 w-9 text-right">{pct}%</span>
          </div>
        )
      },
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Classes & Sections</h1>
          <p className="text-sm text-muted-foreground">Manage classes, sections and class-teacher assignments.</p>
        </div>
        <button className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + New Class
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Classes" value={summary?.totalClasses ?? classes.length} icon="🏛️" />
        <KpiCard label="Total Sections" value={summary?.totalSections ?? sections.length} icon="📂" />
        <KpiCard label="Enrolled Students" value={summary?.totalEnrolled ?? '—'} icon="👥" />
        <KpiCard
          label="Avg Occupancy"
          value={summary ? `${summary.averageOccupancy.toFixed(0)}%` : '—'}
          icon="📊"
          trend={summary && summary.averageOccupancy >= 90 ? 'up' : 'neutral'}
        />
      </div>

      <div className="flex gap-1 mb-4">
        {(['classes', 'sections'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
              activeTab === tab
                ? 'bg-primary-700 text-white'
                : 'bg-white border border-border text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab === 'classes' ? 'Classes' : 'Sections'}
          </button>
        ))}
      </div>

      {activeTab === 'classes' && (
        <>
          {classesQuery.isLoading && <p className="text-muted-foreground">Loading classes…</p>}
          {classesQuery.isError && (
            <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
              Classes data is not yet available from the API. This module will be active once the Academic Management
              backend is deployed.
            </p>
          )}
          {!classesQuery.isLoading && !classesQuery.isError && (
            <DataTable<ClassItem>
              columns={classColumns}
              data={classes}
              rowKey={(r) => r.id}
              searchableFields={['name', 'code', 'programName']}
              pageSize={15}
              emptyMessage="No classes configured yet."
            />
          )}
        </>
      )}

      {activeTab === 'sections' && (
        <>
          {sectionsQuery.isLoading && <p className="text-muted-foreground">Loading sections…</p>}
          {sectionsQuery.isError && (
            <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
              Sections data is not yet available from the API. This module will be active once the Academic Management
              backend is deployed.
            </p>
          )}
          {!sectionsQuery.isLoading && !sectionsQuery.isError && (
            <DataTable<Section>
              columns={sectionColumns}
              data={sections}
              rowKey={(r) => r.id}
              searchableFields={['name', 'className', 'teacherName']}
              pageSize={15}
              emptyMessage="No sections configured yet."
            />
          )}
        </>
      )}
    </div>
  )
}
