import { LabelBadge } from '../common/LabelBadge'

export interface CounselorListCardProps {
  id: string
  name: string
  tagline?: string
  specialties: string[]
  sessionTypes: string[]
  price: string
  rating?: number
  reviewCount?: number
  avatarUrl?: string
  onViewProfile: () => void
}

export function CounselorListCard({
  name,
  tagline,
  specialties,
  sessionTypes,
  price,
  rating,
  reviewCount,
  avatarUrl,
  onViewProfile,
}: CounselorListCardProps) {
  return (
    <div className="border border-neutral-100 rounded-xl p-4 bg-white flex gap-4">
      {/* Avatar */}
      <div className="shrink-0 w-[72px] h-[72px] rounded-lg overflow-hidden bg-primary-50">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[24px] font-bold text-primary-200">
            {name.charAt(0)}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="text-h4 font-medium text-neutral-900">{name}</span>
          {rating != null && (
            <div className="flex items-center gap-0.5 shrink-0">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-accent-400"
                aria-hidden="true"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="text-caption text-neutral-600">{rating.toFixed(1)}</span>
              {reviewCount != null && (
                <span className="text-caption text-neutral-400">({reviewCount})</span>
              )}
            </div>
          )}
        </div>

        {tagline && (
          <p className="text-caption text-neutral-600 truncate">{tagline}</p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {specialties.slice(0, 2).map((s) => (
            <LabelBadge key={s}>{s}</LabelBadge>
          ))}
          {sessionTypes.slice(0, 1).map((t) => (
            <LabelBadge key={t}>{t}</LabelBadge>
          ))}
        </div>

        {/* Price + CTA row */}
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-body-md text-neutral-800">{price}</span>
          <button
            type="button"
            onClick={onViewProfile}
            className="text-body-md text-primary-600"
          >
            프로필 보기
          </button>
        </div>
      </div>
    </div>
  )
}
