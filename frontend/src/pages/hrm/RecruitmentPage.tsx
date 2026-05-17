import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import { formatDate } from '../../lib/utils'

type JobPosting = {
  id: string
  title: string
  department: string
  vacancies: number
  applicantsCount: number
  postedDate: string
  closingDate?: string
  status: 'Open' | 'Closed' | 'OnHold' | 'Filled'
}

type Applicant = {
  id: string
  fullName: string
  jobTitle: string
  appliedDate: string
  experience?: string
  status: 'Applied' | 'Shortlisted' | 'Interviewed' | 'Selected' | 'Rejected'
}

type Summary = {
  openPositions: number
  totalApplicants: number
  shortlisted: number
  selected: number
}

const JOB_STATUS_COLORS: Record<string, string> = {
  Open: 'bg-emerald-100 text-emerald-700',
  Closed: 'bg-gray-100 text-gray-600',
  OnHold: 'bg-amber-100 text-amber-700',
  Filled: 'bg-blue-100 text-blue-700',
}

const APP_STATUS_COLORS: Record<string, string> = {
  Applied: 'bg-gray-100 text-gray-700',
  Shortlisted: 'bg-blue-100 text-blue-700',
  Interviewed: 'bg-amber-100 text-amber-700',
  Selected: 'bg-emerald-100 text-emerald-700',
  Rejected: 'bg-red-100 text-red-700',
}

export default function RecruitmentPage() {
  const [activeTab, setActiveTab] = useState<'postings' | 'applicants'>('postings')

  const summaryQuery = useQuery({
    queryKey: ['recruitment-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<Summary>('/hrm/recruitment/summary')
      return res.data
    },
    retry: false,
  })

  const postingsQuery = useQuery({
    queryKey: ['job-postings'],
    queryFn: async () => {
      const res = await axiosClient.get<JobPosting[] | { items: JobPosting[] }>('/hrm/recruitment/postings')
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
  })

  const applicantsQuery = useQuery({
    queryKey: ['recruitment-applicants'],
    queryFn: async () => {
      const res = await axiosClient.get<Applicant[] | { items: Applicant[] }>('/hrm/recruitment/applicants')
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
    enabled: activeTab === 'applicants',
  })

  const summary = summaryQuery.data
  const postings = postingsQuery.data ?? []
  const applicants = applicantsQuery.data ?? []

  const postingColumns: Column<JobPosting>[] = [
    {
      key: 'title',
      header: 'Position',
      render: (r) => <span className="font-medium text-gray-900">{r.title}</span>,
    },
    { key: 'department', header: 'Department' },
    { key: 'vacancies', header: 'Vacancies', width: '90px' },
    { key: 'applicantsCount', header: 'Applicants', width: '95px' },
    { key: 'postedDate', header: 'Posted', width: '105px', render: (r) => formatDate(r.postedDate) },
    {
      key: 'closingDate',
      header: 'Closing',
      width: '105px',
      render: (r) => (r.closingDate ? formatDate(r.closingDate) : '—'),
    },
    {
      key: 'status',
      header: 'Status',
      width: '90px',
      render: (r) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${JOB_STATUS_COLORS[r.status] ?? ''}`}>
          {r.status}
        </span>
      ),
    },
  ]

  const applicantColumns: Column<Applicant>[] = [
    {
      key: 'fullName',
      header: 'Applicant',
      render: (r) => <span className="font-medium text-gray-900">{r.fullName}</span>,
    },
    { key: 'jobTitle', header: 'Position Applied' },
    { key: 'appliedDate', header: 'Applied On', width: '105px', render: (r) => formatDate(r.appliedDate) },
    { key: 'experience', header: 'Experience', render: (r) => r.experience ?? '—' },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${APP_STATUS_COLORS[r.status] ?? ''}`}>
          {r.status}
        </span>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Recruitment</h1>
          <p className="text-sm text-muted-foreground">Job postings, applicant pipeline and hiring decisions.</p>
        </div>
        <button className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Post Job
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Open Positions" value={summary?.openPositions ?? postings.filter((p) => p.status === 'Open').length} icon="📋" />
        <KpiCard label="Total Applicants" value={summary?.totalApplicants ?? '—'} icon="👥" />
        <KpiCard label="Shortlisted" value={summary?.shortlisted ?? '—'} icon="⭐" trend="up" />
        <KpiCard label="Selected" value={summary?.selected ?? '—'} icon="✅" trend="up" />
      </div>

      <div className="flex gap-1 mb-4">
        {(['postings', 'applicants'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
              activeTab === tab
                ? 'bg-primary-700 text-white'
                : 'bg-white border border-border text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab === 'postings' ? 'Job Postings' : 'Applicants'}
          </button>
        ))}
      </div>

      {activeTab === 'postings' && (
        <>
          {postingsQuery.isLoading && <p className="text-muted-foreground">Loading postings…</p>}
          {postingsQuery.isError && (
            <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
              Recruitment API not yet available. Data will appear once the HRM backend module is deployed.
            </p>
          )}
          {!postingsQuery.isLoading && !postingsQuery.isError && (
            <DataTable<JobPosting>
              columns={postingColumns}
              data={postings}
              rowKey={(r) => r.id}
              searchableFields={['title', 'department']}
              pageSize={15}
              emptyMessage="No job postings yet."
            />
          )}
        </>
      )}

      {activeTab === 'applicants' && (
        <>
          {applicantsQuery.isLoading && <p className="text-muted-foreground">Loading applicants…</p>}
          {applicantsQuery.isError && (
            <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
              Applicant data not yet available.
            </p>
          )}
          {!applicantsQuery.isLoading && !applicantsQuery.isError && (
            <DataTable<Applicant>
              columns={applicantColumns}
              data={applicants}
              rowKey={(r) => r.id}
              searchableFields={['fullName', 'jobTitle']}
              pageSize={15}
              emptyMessage="No applicants yet."
            />
          )}
        </>
      )}
    </div>
  )
}
