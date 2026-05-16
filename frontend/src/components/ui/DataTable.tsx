import { useMemo, useState } from 'react'
import { cn } from '../../lib/utils'

export type Column<T> = {
  key: keyof T | string
  header: string
  render?: (row: T) => React.ReactNode
  width?: string
  className?: string
}

type Props<T> = {
  columns: Column<T>[]
  data: T[]
  rowKey: (row: T) => string
  searchableFields?: (keyof T)[]
  pageSize?: number
  onRowClick?: (row: T) => void
  emptyMessage?: string
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  rowKey,
  searchableFields,
  pageSize = 10,
  onRowClick,
  emptyMessage = 'No records found.',
}: Props<T>) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    if (!query || !searchableFields || searchableFields.length === 0) return data
    const q = query.toLowerCase()
    return data.filter((row) =>
      searchableFields.some((f) => String(row[f] ?? '').toLowerCase().includes(q)),
    )
  }, [data, query, searchableFields])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
      {searchableFields && searchableFields.length > 0 && (
        <div className="p-4 border-b border-border">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            placeholder="Search…"
            className="w-full max-w-md px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  style={col.width ? { width: col.width } : undefined}
                  className={cn('text-left px-4 py-3 font-semibold text-gray-700', col.className)}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            )}
            {paged.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'border-b border-border last:border-b-0',
                  onRowClick && 'cursor-pointer hover:bg-primary-50/40',
                )}
              >
                {columns.map((col) => (
                  <td key={String(col.key)} className={cn('px-4 py-3 text-gray-800', col.className)}>
                    {col.render ? col.render(row) : String(row[col.key as keyof T] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm">
          <span className="text-muted-foreground">
            Page {safePage} of {totalPages} • {filtered.length} records
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="px-3 py-1.5 border border-input rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="px-3 py-1.5 border border-input rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
