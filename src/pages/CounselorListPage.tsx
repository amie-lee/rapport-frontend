import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { CounselorListCard } from '@/components/counselor/CounselorCard'
import { springFetch } from '@/lib/springApi'

interface PublicProfileResponse {
  userId: number
  name: string
  profileImageUrl?: string
  specializations?: string[]
  consultationModes?: Array<'CALL' | 'MEETING' | 'ONLINE' | 'FACE_TO_FACE' | string>
  minPrice?: number
  averageRating?: number
  reviewCount?: number
  bio?: string
}

interface ApiResponse<T> {
  success?: boolean
  data?: T
}

interface PagePublicProfileResponse {
  content?: PublicProfileResponse[]
}

const SPECIALTY_FILTERS = ['불안/우울', '관계/가족', '직장 스트레스', '트라우마', '청소년']
const SESSION_TYPE_FILTERS = ['대면', '비대면']
const PRICE_FILTERS = ['5만원 이하', '5~6만원', '6만원 이상']

export default function CounselorListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [activeSpecialty, setActiveSpecialty] = useState<string | null>(null)
  const [activeSessionType, setActiveSessionType] = useState<string | null>(null)
  const [activePrice, setActivePrice] = useState<string | null>(null)
  const [profiles, setProfiles] = useState<PublicProfileResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const res = await springFetch('/api/v1/counselors')
        if (!res.ok) throw new Error('failed')
        const payload: ApiResponse<PublicProfileResponse[] | PagePublicProfileResponse> = await res.json()
        const rawData = payload?.data
        const normalized = Array.isArray(rawData)
          ? rawData
          : Array.isArray(rawData?.content)
            ? rawData.content
            : []
        setProfiles(normalized)
        setError(null)
      } catch {
        setError('상담사 목록을 불러오지 못했어요.')
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [])

  const modeToLabel = (mode: string) => {
    if (mode === 'CALL' || mode === 'ONLINE') return '비대면(전화)'
    if (mode === 'MEETING' || mode === 'FACE_TO_FACE') return '대면'
    return mode
  }

  const filtered = useMemo(() => {
    return profiles.filter((c) => {
      const specialties = c.specializations ?? []
      const modeLabels = (c.consultationModes ?? []).map(modeToLabel)
      if (search && !c.name.includes(search) && !specialties.some((s) => s.includes(search))) {
        return false
      }
      if (activeSpecialty && !specialties.some((s) => s.includes(activeSpecialty.split('/')[0]))) {
        return false
      }
      if (activeSessionType && !modeLabels.includes(activeSessionType)) {
        return false
      }
      if (activePrice) {
        const price = c.minPrice
        if (price == null) return false
        if (activePrice === '5만원 이하' && price > 50000) return false
        if (activePrice === '5~6만원' && (price < 50000 || price > 60000)) return false
        if (activePrice === '6만원 이상' && price < 60000) return false
      }
      return true
    })
  }, [profiles, search, activeSpecialty, activeSessionType, activePrice])

  // suppress unused variable warning
  void activeSpecialty

  return (
    <div className="flex flex-col">
      {/* Search */}
      <div className="px-5 py-3 bg-white border-b border-neutral-100">
        <Input
          leftIcon={<Search size={16} />}
          placeholder="이름 또는 전문 분야 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="px-5 py-3 flex items-center gap-2 overflow-x-auto border-b border-neutral-100 no-scrollbar">
        {SPECIALTY_FILTERS.map((f) => (
          <Button
            key={f}
            variant="chip"
            selected={activeSpecialty === f}
            onClick={() => setActiveSpecialty(activeSpecialty === f ? null : f)}
            className="shrink-0 whitespace-nowrap"
          >
            {f}
          </Button>
        ))}
        <div className="w-px h-6 bg-neutral-100 shrink-0" />
        {SESSION_TYPE_FILTERS.map((f) => (
          <Button
            key={f}
            variant="chip"
            selected={activeSessionType === f}
            onClick={() => setActiveSessionType(activeSessionType === f ? null : f)}
            className="shrink-0 whitespace-nowrap"
          >
            {f}
          </Button>
        ))}
        <div className="w-px h-6 bg-neutral-100 shrink-0" />
        {PRICE_FILTERS.map((f) => (
          <Button
            key={f}
            variant="chip"
            selected={activePrice === f}
            onClick={() => setActivePrice(activePrice === f ? null : f)}
            className="shrink-0 whitespace-nowrap"
          >
            {f}
          </Button>
        ))}
      </div>

      {/* Counselor list */}
      <div className="flex flex-col gap-3 px-5 py-4">
        {loading && <p className="text-center text-caption text-neutral-400 py-12">불러오는 중...</p>}
        {error && <p className="text-center text-caption text-semantic-error-text py-12">{error}</p>}
        {!loading && !error && filtered.length === 0 ? (
          <p className="text-center text-caption text-neutral-400 py-12">
            검색 결과가 없어요
          </p>
        ) : (
          filtered.map((c) => (
            <CounselorListCard
              key={String(c.userId)}
              id={String(c.userId)}
              name={c.name}
              tagline={c.bio}
              specialties={c.specializations ?? []}
              sessionTypes={(c.consultationModes ?? []).map(modeToLabel)}
              price={c.minPrice != null ? `${c.minPrice.toLocaleString()}원~` : '-'}
              rating={c.averageRating}
              reviewCount={c.reviewCount}
              avatarUrl={c.profileImageUrl}
              onViewProfile={() => navigate(`/counselors/${c.userId}`)}
            />
          ))
        )}
      </div>
    </div>
  )
}
