import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { CounselorCard } from '@/components/ui/Card'
import { Divider } from '@/components/common/Divider'
import { AttachedReportCard } from '@/components/report/AttachedReportCard'
import { springFetch } from '@/lib/springApi'
import bannerImage from '@/assets/banner.png'
import { useNotificationStore } from '@/store/notificationStore'

interface BookingResponse {
  bookingId: number
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | string
  counselorId: number
  counselorName: string
  bookedDate?: string
  bookedStartTime?: string
}

interface ReportSummary {
  reportId: number
  createdAt?: string
  depressionScore?: number
  anxietyScore?: number
  stressScore?: number
}

interface PublicProfileResponse {
  userId: number
  name: string
  profileImageUrl?: string
  specializations?: string[]
  averageRating?: number
  reviewCount?: number
  minPrice?: number
}

interface ClientDashboard {
  upcomingBookings?: BookingResponse[]
  recentReports?: ReportSummary[]
  recommendedCounselors?: PublicProfileResponse[]
  unreadNotificationCount?: number
}

interface ApiResponse<T> {
  success?: boolean
  data?: T
}

function formatReportDate(createdAt?: string) {
  if (!createdAt) return '-'
  return new Date(createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatBookingDateTime(booking?: BookingResponse) {
  if (!booking?.bookedDate) return '-'
  const date = new Date(`${booking.bookedDate}T00:00:00`)
  const weekday = date.toLocaleDateString('ko-KR', { weekday: 'long' })
  const datePart = new Date(`${booking.bookedDate}T00:00:00`).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const time = booking.bookedStartTime ? booking.bookedStartTime.slice(0, 5) : ''
  return `${datePart} ${weekday}${time ? ` ${time}` : ''}`
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const name = user?.name ?? '사용자'
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount)
  const [dashboard, setDashboard] = useState<ClientDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const res = await springFetch('/api/v1/dashboard/client')
        if (!res.ok) throw new Error('dashboard failed')
        const payload: ApiResponse<ClientDashboard> = await res.json()
        const next = payload?.data ?? null
        setDashboard(next)
        setUnreadCount(next?.unreadNotificationCount ?? 0)
        setError(null)
      } catch {
        setError('대시보드 정보를 불러오지 못했어요.')
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [])

  const latestReport = useMemo(
    () => dashboard?.recentReports?.[0] ?? null,
    [dashboard?.recentReports],
  )
  const nextBooking = useMemo(
    () => dashboard?.upcomingBookings?.[0] ?? null,
    [dashboard?.upcomingBookings],
  )
  const counselors = dashboard?.recommendedCounselors ?? []
  return (
    <div className="px-5 py-5 flex flex-col gap-6">
      {/* Greeting */}
      <div>
        <h2 className="text-h2-mobile font-bold text-neutral-900">
          안녕하세요, {name}님
        </h2>
        <p className="text-caption text-neutral-400 mt-0.5">{today}</p>
      </div>
      {loading && <p className="text-caption text-neutral-400">불러오는 중...</p>}
      {error && <p className="text-caption text-semantic-error-text">{error}</p>}

      {/* Chatbot CTA */}
      <button
        type="button"
        onClick={() => navigate('/chat')}
        className="w-full h-[144px] border border-primary-200 rounded-xl px-5 py-4 text-left bg-no-repeat"
        style={{
          backgroundColor: '#ebf3e9',
          backgroundImage: `url(${bannerImage})`,
          backgroundSize: '58% auto',
          backgroundPosition: 'right 8px center',
        }}
      >
        <p className="text-body-lg font-medium text-primary-900 pr-[42%]">
          사전 점검 시작하기 →
        </p>
        <p className="text-caption text-primary-800 mt-1 pr-[42%]">
          AI와 대화로 나의 상태를 파악해요
        </p>
      </button>

      {/* Recent Report */}
      <div>
        <Divider />
        <div className="pt-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-body-md text-neutral-600">
              {latestReport ? `최근 리포트 · ${formatReportDate(latestReport.createdAt)}` : '최근 리포트가 없어요'}
            </span>
            {latestReport && (
              <button
                type="button"
                onClick={() => navigate(`/report/${latestReport.reportId}`)}
                className="text-body-md text-primary-600"
              >
                리포트 보기
              </button>
            )}
          </div>
          <AttachedReportCard
            title="최근 리포트 요약"
            attached={!!latestReport}
            showStatus={false}
            createdAt={latestReport?.createdAt}
            depressionScore={latestReport?.depressionScore}
            anxietyScore={latestReport?.anxietyScore}
            stressScore={latestReport?.stressScore}
          />
        </div>
      </div>

      {/* Next Booking */}
      {nextBooking && (
        <div>
          <Divider />
          <div className="pt-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-caption text-neutral-400 mb-0.5">다음 예약</p>
                <p className="text-body-md font-medium text-neutral-900">
                  {formatBookingDateTime(nextBooking)}
                </p>
                <p className="text-body-md text-neutral-600">
                  {nextBooking.counselorName} 상담사
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/sessions`)}
                className="text-body-md text-primary-600 shrink-0"
              >
                예약 상세
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recommended Counselors */}
      <div>
        <Divider />
        <div className="pt-4">
          <h3 className="text-[16px] font-bold text-neutral-900 mb-3">추천 상담사</h3>
          {counselors.length === 0 ? (
            <p className="text-caption text-neutral-400">추천 상담사가 아직 없어요</p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 no-scrollbar">
              {counselors.map((c) => (
                <CounselorCard
                  key={c.userId}
                  name={c.name}
                  specialties={c.specializations ?? []}
                  rating={c.averageRating}
                  reviewCount={c.reviewCount}
                  price={c.minPrice != null ? `${c.minPrice.toLocaleString()}원~` : undefined}
                  avatarUrl={c.profileImageUrl}
                  onBook={() => navigate(`/counselors/${c.userId}`)}
                  className="shrink-0"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
