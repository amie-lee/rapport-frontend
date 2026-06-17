interface CounselorRecommendCardProps {
  name: string
  avatarUrl: string
  specialties: string[]
}

export function CounselorRecommendCard({
  name,
  avatarUrl,
  specialties,
}: CounselorRecommendCardProps) {
  return (
    <div className="w-[160px] shrink-0 rounded-lg border border-neutral-200 bg-white overflow-hidden">
      <img src={avatarUrl} alt={name} className="w-full h-[156px] object-cover" />
      <div className="px-3 py-3">
        <p className="text-h4-mobile font-bold text-neutral-900 text-center">{name} 상담사</p>
        <div className="mt-2 flex items-center justify-center gap-1.5 flex-wrap">
          {specialties.map((specialty) => (
            <span
              key={specialty}
              className="inline-flex items-center rounded-full bg-primary-50 text-primary-600 text-small px-2 py-0.5"
            >
              {specialty}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

