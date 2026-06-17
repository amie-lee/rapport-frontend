import { forwardRef } from 'react'
import { cn } from '../../lib/utils'
import { Badge } from './Badge'
import { Button } from './Button'

// ─── Card (base wrapper) ────────────────────────────────────────────────────

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-white rounded-xl border border-neutral-100 shadow-sm',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
)
Card.displayName = 'Card'

// ─── ScoreBar (internal) ────────────────────────────────────────────────────

interface ScoreBarProps {
  label: string
  value: number
}

function ScoreBar({ label, value }: ScoreBarProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const fillColor =
    clamped <= 40
      ? 'bg-primary-400'
      : clamped <= 60
        ? 'bg-accent-400'
        : 'bg-semantic-error-text'

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="text-small text-neutral-600">{label}</span>
        <span className="text-small text-neutral-800 font-medium">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-primary-200 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', fillColor)}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  )
}

// ─── ReportCard ─────────────────────────────────────────────────────────────

export interface ReportCardProps extends React.HTMLAttributes<HTMLDivElement> {
  date?: string
  overallLabel: string
  scores: { label: string; value: number }[]
  onDetail?: () => void
}

const ReportCard = forwardRef<HTMLDivElement, ReportCardProps>(
  ({ date, overallLabel, scores, onDetail, className, ...props }, ref) => (
    <Card
      ref={ref}
      className={cn('min-w-[256px] p-4 flex flex-col gap-3', className)}
      {...props}
    >
      <div className="flex justify-between items-center">
        {date && (
          <span className="text-neutral-600 text-body-md">{date}</span>
        )}
        <Badge variant="score" className="ml-auto">
          {overallLabel}
        </Badge>
      </div>

      <div className="flex flex-col gap-2">
        {scores.map((s) => (
          <ScoreBar key={s.label} label={s.label} value={s.value} />
        ))}
      </div>

      <Button variant="ghost" size='sm' className="w-full" onClick={onDetail}>
        자세히 보기
      </Button>
    </Card>
  ),
)
ReportCard.displayName = 'ReportCard'

// ─── CounselorCard ──────────────────────────────────────────────────────────

export interface CounselorCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  specialties: string[]
  rating?: number
  reviewCount?: number
  price?: string
  avatarUrl?: string
  onBook?: () => void
}

const CounselorCard = forwardRef<HTMLDivElement, CounselorCardProps>(
  (
    { name, specialties, rating, reviewCount, price, avatarUrl, onBook, className, ...props },
    ref,
  ) => {
    const twoTagLength = (specialties[0]?.length ?? 0) + (specialties[1]?.length ?? 0)
    const visibleCount = twoTagLength >= 8 ? 1 : 2
    const visibleSpecialties = specialties.slice(0, visibleCount)
    const hiddenCount = Math.max(0, specialties.length - visibleCount)

    return (
      <Card
        ref={ref}
        className={cn('w-[160px] flex flex-col overflow-hidden', className)}
        {...props}
      >
      {/* Top image area */}
      <div className="w-full h-24 bg-primary-50 overflow-hidden rounded-t-xl shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[32px] font-bold text-primary-200">
            {name.charAt(0)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col items-center gap-2">
        <span className="text-h4 font-medium text-neutral-900 text-center">{name}</span>

        <div className="flex flex-nowrap gap-1 justify-center overflow-hidden w-full">
          {visibleSpecialties.map((s) => (
            <Badge key={s} variant="specialty" className="shrink-0 max-w-[56px] truncate">
              {s}
            </Badge>
          ))}
          {hiddenCount > 0 && (
            <Badge variant="specialty" className="shrink-0">
              +{hiddenCount}
            </Badge>
          )}
        </div>

        {rating != null && (
          <div className="flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-accent-400 shrink-0"
              aria-hidden="true"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="text-body-md font-medium text-neutral-800">
              {rating.toFixed(1)}
            </span>
            {reviewCount != null && (
              <span className="text-caption text-neutral-400">
                ({reviewCount.toLocaleString()})
              </span>
            )}
          </div>
        )}

        {price && (
          <span className="text-body-md font-medium text-neutral-900">{price}</span>
        )}

        <Button variant="primary" className="w-full" onClick={onBook}>
          예약하기
        </Button>
      </div>
    </Card>
    )
  },
)
CounselorCard.displayName = 'CounselorCard'

export { Card, ReportCard, CounselorCard }
