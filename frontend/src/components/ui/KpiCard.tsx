import { cn } from '../../lib/utils'

type Trend = 'up' | 'down' | 'neutral'

type Props = {
  label: string
  value: string | number
  hint?: string
  trend?: Trend
  trendValue?: string
  icon?: React.ReactNode
  className?: string
}

const trendColor: Record<Trend, string> = {
  up: 'text-emerald-600',
  down: 'text-red-600',
  neutral: 'text-muted-foreground',
}

export default function KpiCard({ label, value, hint, trend = 'neutral', trendValue, icon, className }: Props) {
  return (
    <div className={cn('bg-white rounded-xl border border-border p-5 shadow-sm', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-2">{value}</p>
          {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
        </div>
        {icon && <div className="text-primary-600 text-2xl">{icon}</div>}
      </div>
      {trendValue && (
        <p className={cn('text-xs mt-3 font-medium', trendColor[trend])}>
          {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '•'} {trendValue}
        </p>
      )}
    </div>
  )
}
