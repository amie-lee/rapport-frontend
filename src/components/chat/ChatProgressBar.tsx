interface ChatProgressBarProps {
  current: number
  total: number
}

export function ChatProgressBar({ current, total }: ChatProgressBarProps) {
  const safeTotal = Math.max(total, 1)
  const clamped = Math.max(0, Math.min(current, safeTotal))
  const width = (clamped / safeTotal) * 100

  return (
    <div className="h-2 rounded-full bg-neutral-200 overflow-hidden">
      <div
        className="h-full rounded-full bg-primary-200 transition-all duration-300"
        style={{ width: `${width}%` }}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={safeTotal}
      />
    </div>
  )
}

