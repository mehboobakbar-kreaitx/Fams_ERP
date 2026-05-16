import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { axiosClient } from '../../api/axiosClient'
import { authStore } from '../../store/authStore'
import { formatDate } from '../../lib/utils'

type Document = {
  id: string
  fileName: string
  documentType: string
  uploadedAt: string
  sizeBytes?: number
  downloadUrl: string
}

const DOC_TYPES = ['Birth Certificate', 'B-Form', 'CNIC', 'Previous School Result', 'Other']

function humanSize(bytes?: number) {
  if (!bytes) return '—'
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  return `${(kb / 1024).toFixed(2)} MB`
}

export default function DocumentsPage() {
  const qc = useQueryClient()
  const { user } = authStore.getState()
  const [docType, setDocType] = useState(DOC_TYPES[0])
  const fileInput = useRef<HTMLInputElement>(null)

  const docs = useQuery({
    queryKey: ['my-documents', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await axiosClient.get<Document[] | { items: Document[] }>(`/students/${user!.id}/documents`, {
        headers: { 'x-skip-error-toast': '1' },
      })
      return Array.isArray(res.data) ? res.data : res.data.items ?? []
    },
    retry: 0,
  })

  const upload = useMutation({
    mutationFn: async () => {
      const file = fileInput.current?.files?.[0]
      if (!file) throw new Error('Choose a file before uploading.')
      const fd = new FormData()
      fd.append('file', file)
      fd.append('documentType', docType)
      const { data } = await axiosClient.post<{ id: string }>(`/students/${user!.id}/documents`, fd, {
        headers: { 'Content-Type': 'multipart/form-data', 'x-skip-error-toast': '1' },
      })
      return data
    },
    onSuccess: () => {
      toast.success('Document uploaded.')
      if (fileInput.current) fileInput.current.value = ''
      qc.invalidateQueries({ queryKey: ['my-documents'] })
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string; title?: string } }; message?: string }
      toast.error(e.response?.data?.error ?? e.response?.data?.title ?? e.message ?? 'Upload failed.')
    },
  })

  const rows = docs.data ?? []

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">My Documents</h1>
      <p className="text-sm text-muted-foreground mb-6">Personal records on file with the campus.</p>

      <div className="bg-white rounded-xl border border-border p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-3">Upload New</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Document Type</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm"
            >
              {DOC_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">File</label>
            <input
              ref={fileInput}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="w-full text-sm"
            />
          </div>
          <button
            type="button"
            onClick={() => upload.mutate()}
            disabled={upload.isPending}
            className="bg-primary-700 hover:bg-primary-800 text-white text-sm rounded-lg px-4 py-2 disabled:opacity-50"
          >
            {upload.isPending ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Stored Documents</h2>
        {docs.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {docs.isError && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            Documents endpoint not yet available.
          </div>
        )}
        {!docs.isLoading && !docs.isError && rows.length === 0 && (
          <p className="text-sm text-muted-foreground">No documents on file.</p>
        )}
        {!docs.isLoading && !docs.isError && rows.length > 0 && (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-gray-700">Document</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-700">Type</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-700">Size</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-700">Uploaded</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-700"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id} className="border-b border-border">
                  <td className="px-3 py-2 font-medium">{d.fileName}</td>
                  <td className="px-3 py-2">{d.documentType}</td>
                  <td className="px-3 py-2">{humanSize(d.sizeBytes)}</td>
                  <td className="px-3 py-2">{formatDate(d.uploadedAt)}</td>
                  <td className="px-3 py-2">
                    <a
                      href={d.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary-700 hover:underline text-sm"
                    >
                      Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
