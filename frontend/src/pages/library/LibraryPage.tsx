import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { axiosClient } from '../../api/axiosClient'
import KpiCard from '../../components/ui/KpiCard'
import DataTable, { type Column } from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import { formatDate } from '../../lib/utils'

type BookStatus = 'Available' | 'PartiallyAvailable' | 'AllIssued' | 'Lost' | 'Damaged'
type IssuanceStatus = 'Issued' | 'Returned' | 'Overdue' | 'Lost'
type MemberType = 'Student' | 'Staff'

type Book = {
  id: string
  isbn: string
  title: string
  author: string
  publisher?: string
  category: string
  totalCopies: number
  availableCopies: number
  status: BookStatus
  location: string
  publishYear?: number
}

type Issuance = {
  id: string
  bookId: string
  bookTitle: string
  isbn: string
  memberId: string
  memberName: string
  memberType: MemberType
  class?: string
  issuedDate: string
  dueDate: string
  returnedDate?: string
  status: IssuanceStatus
  fineAmount?: number
}

type Member = {
  id: string
  memberId: string
  name: string
  memberType: MemberType
  class?: string
  department?: string
  phone?: string
  totalBorrowings: number
  activeBorrowings: number
  totalFinesPaid: number
  memberSince: string
}

type LibrarySummary = {
  totalBooks: number
  totalCopies: number
  issuedCopies: number
  overdueCount: number
  totalMembers: number
  activeIssuances: number
  totalFinesPending: number
}

const BOOK_STATUS_COLORS: Record<BookStatus, string> = {
  Available:           'bg-emerald-100 text-emerald-700',
  PartiallyAvailable:  'bg-amber-100 text-amber-700',
  AllIssued:           'bg-red-100 text-red-600',
  Lost:                'bg-gray-100 text-gray-600',
  Damaged:             'bg-orange-100 text-orange-700',
}

const ISSUANCE_STATUS_COLORS: Record<IssuanceStatus, string> = {
  Issued:   'bg-blue-100 text-blue-700',
  Returned: 'bg-emerald-100 text-emerald-700',
  Overdue:  'bg-red-100 text-red-700',
  Lost:     'bg-gray-100 text-gray-600',
}

const CATEGORIES = ['All', 'Science', 'Mathematics', 'English', 'Urdu', 'Islamic Studies', 'History', 'Geography', 'Reference', 'Fiction', 'Other']

type Tab = 'catalog' | 'issuances' | 'members' | 'overdue'

export default function LibraryPage() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<Tab>('catalog')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [issueForm, setIssueForm] = useState({ bookId: '', memberId: '', dueDate: '' })

  const summaryQuery = useQuery({
    queryKey: ['library-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<LibrarySummary>('/library/summary')
      return res.data
    },
    retry: false,
  })

  const booksQuery = useQuery({
    queryKey: ['library-books', categoryFilter],
    queryFn: async () => {
      const params = categoryFilter !== 'All' ? { category: categoryFilter } : {}
      const res = await axiosClient.get<Book[] | { items: Book[] }>('/library/books', { params })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
    enabled: activeTab === 'catalog',
  })

  const issuancesQuery = useQuery({
    queryKey: ['library-issuances'],
    queryFn: async () => {
      const res = await axiosClient.get<Issuance[] | { items: Issuance[] }>('/library/issuances')
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
    enabled: activeTab === 'issuances',
  })

  const membersQuery = useQuery({
    queryKey: ['library-members'],
    queryFn: async () => {
      const res = await axiosClient.get<Member[] | { items: Member[] }>('/library/members')
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
    enabled: activeTab === 'members',
  })

  const overdueQuery = useQuery({
    queryKey: ['library-overdue'],
    queryFn: async () => {
      const res = await axiosClient.get<Issuance[] | { items: Issuance[] }>('/library/issuances', { params: { status: 'Overdue' } })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: false,
    enabled: activeTab === 'overdue',
  })

  const issueMutation = useMutation({
    mutationFn: (data: typeof issueForm) => axiosClient.post('/library/issuances', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library-issuances'] })
      qc.invalidateQueries({ queryKey: ['library-books'] })
      qc.invalidateQueries({ queryKey: ['library-summary'] })
      setShowIssueModal(false)
      setIssueForm({ bookId: '', memberId: '', dueDate: '' })
    },
  })

  const returnMutation = useMutation({
    mutationFn: (id: string) => axiosClient.patch(`/library/issuances/${id}/return`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library-issuances'] })
      qc.invalidateQueries({ queryKey: ['library-overdue'] })
      qc.invalidateQueries({ queryKey: ['library-books'] })
      qc.invalidateQueries({ queryKey: ['library-summary'] })
    },
  })

  const s = summaryQuery.data

  const bookColumns: Column<Book>[] = [
    { key: 'isbn', header: 'ISBN', width: '120px', render: (r) => <span className="font-mono text-xs">{r.isbn}</span> },
    {
      key: 'title', header: 'Title / Author',
      render: (r) => <div><p className="font-medium text-gray-900">{r.title}</p><p className="text-xs text-muted-foreground">{r.author}{r.publisher ? ` · ${r.publisher}` : ''}</p></div>,
    },
    { key: 'category', header: 'Category', width: '120px' },
    {
      key: 'availableCopies', header: 'Available', width: '100px',
      render: (r) => (
        <div>
          <p className={`font-semibold ${r.availableCopies === 0 ? 'text-red-600' : r.availableCopies < r.totalCopies / 2 ? 'text-amber-600' : 'text-emerald-700'}`}>
            {r.availableCopies}/{r.totalCopies}
          </p>
        </div>
      ),
    },
    { key: 'location', header: 'Shelf', width: '100px' },
    {
      key: 'status', header: 'Status', width: '150px',
      render: (r) => <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${BOOK_STATUS_COLORS[r.status]}`}>{r.status}</span>,
    },
  ]

  const issuanceColumns: Column<Issuance>[] = [
    { key: 'bookTitle', header: 'Book', render: (r) => <div><p className="font-medium">{r.bookTitle}</p><p className="text-xs font-mono text-muted-foreground">{r.isbn}</p></div> },
    { key: 'memberName', header: 'Member', render: (r) => <div><p className="text-sm">{r.memberName}</p><p className="text-xs text-muted-foreground">{r.memberType}{r.class ? ` · ${r.class}` : ''}</p></div> },
    { key: 'issuedDate', header: 'Issued', width: '105px', render: (r) => <span className="font-mono text-xs">{formatDate(r.issuedDate)}</span> },
    {
      key: 'dueDate', header: 'Due Date', width: '105px',
      render: (r) => {
        const overdue = r.status === 'Issued' && new Date(r.dueDate) < new Date()
        return <span className={`font-mono text-xs ${overdue ? 'text-red-600 font-bold' : ''}`}>{formatDate(r.dueDate)}</span>
      },
    },
    { key: 'returnedDate', header: 'Returned', width: '105px', render: (r) => r.returnedDate ? <span className="font-mono text-xs">{formatDate(r.returnedDate)}</span> : <span className="text-muted-foreground">—</span> },
    {
      key: 'status', header: 'Status', width: '110px',
      render: (r) => <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${ISSUANCE_STATUS_COLORS[r.status]}`}>{r.status}</span>,
    },
    {
      key: 'id', header: '', width: '90px',
      render: (r) => r.status === 'Issued' || r.status === 'Overdue'
        ? <button onClick={() => returnMutation.mutate(r.id)} disabled={returnMutation.isPending}
            className="px-3 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50">Return</button>
        : null,
    },
  ]

  const memberColumns: Column<Member>[] = [
    { key: 'memberId', header: 'ID', width: '100px', render: (r) => <span className="font-mono text-xs font-semibold text-primary-700">{r.memberId}</span> },
    { key: 'name', header: 'Member', render: (r) => <div><p className="font-medium">{r.name}</p><p className="text-xs text-muted-foreground">{r.memberType}{r.class ? ` · ${r.class}` : r.department ? ` · ${r.department}` : ''}</p></div> },
    { key: 'activeBorrowings', header: 'Active', width: '80px', render: (r) => <span className={`font-semibold ${r.activeBorrowings > 0 ? 'text-primary-700' : 'text-muted-foreground'}`}>{r.activeBorrowings}</span> },
    { key: 'totalBorrowings',  header: 'Total',  width: '70px' },
    { key: 'memberSince', header: 'Since', width: '105px', render: (r) => <span className="font-mono text-xs">{formatDate(r.memberSince)}</span> },
  ]

  const TABS: { key: Tab; label: string }[] = [
    { key: 'catalog',   label: 'Book Catalog' },
    { key: 'issuances', label: 'Issuances' },
    { key: 'members',   label: 'Members' },
    { key: 'overdue',   label: `Overdue${s?.overdueCount ? ` (${s.overdueCount})` : ''}` },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Library Management</h1>
          <p className="text-sm text-muted-foreground">Book catalog, issuances, members and overdue tracking.</p>
        </div>
        {activeTab === 'issuances' && (
          <button onClick={() => setShowIssueModal(true)}
            className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
            + Issue Book
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Books"    value={s?.totalBooks ?? '—'}          icon="📚" />
        <KpiCard label="Issued Copies"  value={s?.issuedCopies ?? '—'}        icon="📖" />
        <KpiCard label="Overdue"        value={s?.overdueCount ?? '—'}        icon="⚠️" trend={s && s.overdueCount > 0 ? 'down' : 'up'} />
        <KpiCard label="Members"        value={s?.totalMembers ?? '—'}        icon="👥" />
      </div>

      {summaryQuery.isError && (
        <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          Library API not yet available. Will appear once the Library backend module is deployed.
        </p>
      )}

      <div className="flex gap-1 mb-4">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === t.key ? 'bg-primary-700 text-white' : 'bg-white border border-border text-gray-700 hover:bg-gray-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'catalog' && (
        <>
          <div className="flex gap-1 flex-wrap mb-3">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategoryFilter(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${categoryFilter === c ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-gray-700 border-border hover:bg-gray-50'}`}>
                {c}
              </button>
            ))}
          </div>
          {!booksQuery.isLoading && !booksQuery.isError && (
            <DataTable<Book> columns={bookColumns} data={booksQuery.data ?? []} rowKey={(r) => r.id}
              searchableFields={['isbn', 'title', 'author', 'category', 'location']}
              pageSize={15} emptyMessage="No books in catalog." />
          )}
        </>
      )}

      {activeTab === 'issuances' && !issuancesQuery.isLoading && !issuancesQuery.isError && (
        <DataTable<Issuance> columns={issuanceColumns} data={issuancesQuery.data ?? []} rowKey={(r) => r.id}
          searchableFields={['bookTitle', 'isbn', 'memberName']}
          pageSize={15} emptyMessage="No issuance records." />
      )}

      {activeTab === 'members' && !membersQuery.isLoading && !membersQuery.isError && (
        <DataTable<Member> columns={memberColumns} data={membersQuery.data ?? []} rowKey={(r) => r.id}
          searchableFields={['memberId', 'name', 'class', 'department']}
          pageSize={15} emptyMessage="No library members." />
      )}

      {activeTab === 'overdue' && !overdueQuery.isLoading && !overdueQuery.isError && (
        <DataTable<Issuance> columns={issuanceColumns} data={overdueQuery.data ?? []} rowKey={(r) => r.id}
          searchableFields={['bookTitle', 'memberName']}
          pageSize={15} emptyMessage="No overdue books — great!" />
      )}

      <Modal open={showIssueModal} onClose={() => setShowIssueModal(false)} title="Issue Book" size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowIssueModal(false)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-gray-50">Cancel</button>
            <button form="issue-form" type="submit" disabled={issueMutation.isPending}
              className="px-4 py-2 text-sm bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-50">
              {issueMutation.isPending ? 'Saving…' : 'Issue Book'}
            </button>
          </div>
        }>
        <form id="issue-form" onSubmit={(e) => { e.preventDefault(); issueMutation.mutate(issueForm) }} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Book ID *</label>
            <input value={issueForm.bookId} onChange={(e) => setIssueForm((p) => ({ ...p, bookId: e.target.value }))} required
              placeholder="ISBN or Book ID" className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Member ID *</label>
            <input value={issueForm.memberId} onChange={(e) => setIssueForm((p) => ({ ...p, memberId: e.target.value }))} required
              placeholder="Library Member ID" className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Due Date *</label>
            <input type="date" value={issueForm.dueDate} onChange={(e) => setIssueForm((p) => ({ ...p, dueDate: e.target.value }))} required
              className="w-full border border-input rounded-lg px-3 py-2 text-sm" />
          </div>
          {issueMutation.isError && <p className="text-sm text-red-600">Failed to issue book.</p>}
        </form>
      </Modal>
    </div>
  )
}
