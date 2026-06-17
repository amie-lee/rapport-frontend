import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/layout/PageHeader'
import { LabelBadge } from '@/components/common/LabelBadge'
import { Divider } from '@/components/common/Divider'
import { springFetch } from '@/lib/springApi'

interface CounselorDetail {
  userId: number
  name: string
  bio?: string
  specializations?: string[]
  symptoms?: string[]
  approaches?: string[]
  consultationModes?: Array<'CALL' | 'MEETING' | 'ONLINE' | 'FACE_TO_FACE' | string>
  minPrice?: number
  profileImageUrl?: string
  licenseType?: string
  experienceYears?: number
  averageRating?: number
  reviewCount?: number
}

interface SessionTypePrice {
  id: number
  sessionTypeId: number
  name: string
  price: number
}

interface ReviewResponse {
  reviewId?: number
  rating?: number
  content?: string
  comment?: string
  clientName?: string
  createdAt?: string
}

interface ApiResponse<T> {
  success?: boolean
  data?: T
}

function normalizeReviews(payload: unknown): ReviewResponse[] {
  const root = payload as {
    data?: unknown
    content?: unknown
    items?: unknown
    list?: unknown
    reviews?: unknown
  }
  const data = root?.data as {
    content?: unknown
    items?: unknown
    list?: unknown
    reviews?: unknown
    data?: unknown
  } | undefined

  const candidates = [
    root?.data,
    root?.content,
    root?.items,
    root?.list,
    root?.reviews,
    data?.content,
    data?.items,
    data?.list,
    data?.reviews,
    data?.data,
  ]

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as ReviewResponse[]
  }
  return []
}

function renderRatingStars(rating?: number) {
  const safe = Math.max(0, Math.min(5, Math.round(rating ?? 0)))
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, idx) => (
        <Star
          key={idx}
          size={14}
          className={idx < safe ? 'text-amber-400 fill-amber-400' : 'text-neutral-300'}
        />
      ))}
    </div>
  )
}

export default function CounselorDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [counselor, setCounselor] = useState<CounselorDetail | null>(null)
  const [sessionTypes, setSessionTypes] = useState<SessionTypePrice[]>([])
  const [reviews, setReviews] = useState<ReviewResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      if (!id) return
      setLoading(true)
      try {
        const [detailRes, typeRes, reviewRes] = await Promise.all([
          springFetch(`/api/v1/counselors/${id}`),
          springFetch(`/api/v1/counselors/${id}/session-types`),
          springFetch(`/api/v1/counselors/${id}/reviews?page=0&size=5`),
        ])

        if (!detailRes.ok) throw new Error('detail failed')
        const detailPayload: ApiResponse<CounselorDetail> = await detailRes.json()
        setCounselor(detailPayload?.data ?? null)

        if (typeRes.ok) {
          const typePayload: ApiResponse<SessionTypePrice[]> = await typeRes.json()
          setSessionTypes(typePayload?.data ?? [])
        }
        if (reviewRes.ok) {
          const reviewPayload = await reviewRes.json().catch(() => ({}))
          setReviews(normalizeReviews(reviewPayload))
        }

        setError(null)
      } catch {
        setError('상담사 정보를 불러오지 못했어요.')
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [id])

  const sessionTypeNames = useMemo(
    () => sessionTypes.map((s) => s.name).filter(Boolean),
    [sessionTypes],
  )

  const modeLabels = useMemo(() => {
    const modeSource = counselor?.consultationModes?.length
      ? counselor.consultationModes
      : (counselor?.approaches ?? []).filter((v) => v === 'MEETING' || v === 'CALL')

    return modeSource.map((mode) => {
      if (mode === 'CALL' || mode === 'ONLINE') return '비대면(전화)'
      if (mode === 'MEETING' || mode === 'FACE_TO_FACE') return '대면'
      return mode
    })
  }, [counselor?.consultationModes, counselor?.approaches])

  const approachLabels = useMemo(
    () => (counselor?.approaches ?? []).filter((v) => v !== 'MEETING' && v !== 'CALL'),
    [counselor?.approaches],
  )

  const minPrice = useMemo(() => {
    if (counselor?.minPrice != null) return counselor.minPrice
    if (!sessionTypes.length) return null
    return Math.min(...sessionTypes.map((s) => s.price))
  }, [counselor?.minPrice, sessionTypes])

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title="" />
      {loading && <p className="px-5 py-4 text-caption text-neutral-400">불러오는 중...</p>}
      {error && <p className="px-5 py-4 text-caption text-semantic-error-text">{error}</p>}
      {!counselor ? null : (
        <>

      {/* Hero image */}
      <div className="w-full h-56 bg-primary-50 overflow-hidden shrink-0">
        {counselor.profileImageUrl ? (
          <img
            src={counselor.profileImageUrl}
            alt={counselor.name}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[80px] font-bold text-primary-200">
            {counselor.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Hero text */}
      <div className="px-5 py-4">
        <h1 className="text-h1-mobile font-bold text-neutral-900">{counselor.name}</h1>
        <p className="text-body-md text-neutral-600 mt-1">{counselor.bio ?? '상담사 소개가 준비 중입니다.'}</p>
      </div>

      {/* 전문 분야 */}
      <Divider />
      <section className="px-5 py-4">
        <h3 className="text-[16px] font-bold text-neutral-900 mb-3">전문 분야</h3>
        <div className="flex flex-wrap gap-2">
          {(counselor.specializations ?? []).map((s) => (
            <LabelBadge key={s}>{s}</LabelBadge>
          ))}
        </div>
      </section>

      {/* 상담 방식 */}
      <Divider />
      <section className="px-5 py-4">
        <h3 className="text-[16px] font-bold text-neutral-900 mb-3">상담 방식</h3>
        <div className="flex flex-wrap gap-2">
          {(modeLabels.length ? modeLabels : sessionTypeNames).map((t) => (
            <LabelBadge key={t}>{t}</LabelBadge>
          ))}
        </div>
      </section>

      {/* 상담 기법 */}
      {approachLabels.length > 0 && (
        <>
          <Divider />
          <section className="px-5 py-4">
            <h3 className="text-[16px] font-bold text-neutral-900 mb-3">상담 기법</h3>
            <div className="flex flex-wrap gap-2">
              {approachLabels.map((approach) => (
                <LabelBadge key={approach}>{approach}</LabelBadge>
              ))}
            </div>
          </section>
        </>
      )}

      {/* 전문 증상 */}
      <Divider />
      <section className="px-5 py-4">
        <h3 className="text-[16px] font-bold text-neutral-900 mb-3">전문 증상</h3>
        <div className="flex flex-wrap gap-2">
          {(counselor.symptoms ?? []).map((symptom) => (
            <LabelBadge key={symptom}>{symptom}</LabelBadge>
          ))}
        </div>
      </section>

      {/* 경력 */}
      <Divider />
      <section className="px-5 py-4">
        <h3 className="text-[16px] font-bold text-neutral-900 mb-3">경력 및 학력</h3>
        <div className="flex flex-col gap-2">
          <p className="text-caption text-neutral-600">
            경력 {counselor.experienceYears ?? 0}년
          </p>
        </div>
      </section>

      {/* 가격 */}
      <Divider />
      <section className="px-5 py-4">
        <h3 className="text-[16px] font-bold text-neutral-900 mb-2">상담 비용</h3>
        <p className="text-body-lg font-medium text-neutral-900">
          {minPrice != null ? `${minPrice.toLocaleString()}원~` : '상담 유형별 상이'}
        </p>
        <p className="text-caption text-neutral-400 mt-1">
          상담 유형에 따라 비용이 달라질 수 있어요
        </p>
      </section>

      {/* 리뷰 */}
      <Divider />
      <section className="px-5 py-4">
        <h3 className="text-[16px] font-bold text-neutral-900 mb-3">리뷰</h3>
        <p className="text-body-md text-neutral-800">
          평점 {counselor.averageRating?.toFixed(1) ?? '-'} ({counselor.reviewCount ?? 0}개)
        </p>
        <div className="mt-3 flex flex-col gap-3">
          {reviews.length === 0 ? (
            <p className="text-caption text-neutral-400">아직 등록된 리뷰가 없어요.</p>
          ) : (
            reviews.map((review, idx) => (
              <div key={review.reviewId ?? idx} className="rounded-md border border-neutral-100 bg-neutral-50 px-3 py-3">
                <div className="flex items-center gap-2">
                  {renderRatingStars(review.rating)}
                </div>
                <p className="text-caption text-neutral-800 mt-1 whitespace-pre-wrap">
                  {review.content?.trim() || review.comment?.trim() || '내용 없음'}
                </p>
                {review.clientName && (
                  <p className="text-small text-neutral-500 mt-1">{review.clientName}</p>
                )}
                {review.createdAt && (
                  <p className="text-small text-neutral-400 mt-1">
                    {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Bottom CTA */}
      <div className="mt-auto px-5 pb-3 pt-3 bg-white border-t border-neutral-100">
        <Button
          variant="primary"
          size="lg"
          className="w-full rounded-lg"
          onClick={() => navigate(`/booking/${counselor.userId}`)}
        >
          예약하기
        </Button>
      </div>
      </>
      )}
    </div>
  )
}
