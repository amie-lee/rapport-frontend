interface EmotionScoreCardProps {
  label: string
  score: number
  barColorClass: string
  rationale?: string
}

export function EmotionScoreCard({
  label,
  score,
  barColorClass,
  rationale,
}: EmotionScoreCardProps) {
  const clamped = Math.max(0, Math.min(100, score))

  return (
    <div className="rounded-md bg-neutral-50 px-4 py-3.5 border border-neutral-100">
      <div className="flex items-center justify-between">
        <span className="text-h3-mobile font-medium text-neutral-900">{label}</span>
        <span className="text-h3-mobile font-bold text-neutral-900">{clamped}</span>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-neutral-200 overflow-hidden">
        <div
          className={`h-full rounded-full ${barColorClass}`}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-label={`${label} 점수`}
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {rationale && (
        <p className="mt-2 text-caption text-neutral-600 leading-relaxed">{rationale}</p>
      )}
    </div>
  )
}
