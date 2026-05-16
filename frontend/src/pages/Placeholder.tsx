type Props = { title: string; note?: string }

export default function Placeholder({ title, note }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="text-4xl mb-3">🚧</div>
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1 max-w-md">
        {note ?? 'This page is part of an upcoming sprint and is not yet implemented.'}
      </p>
    </div>
  )
}
