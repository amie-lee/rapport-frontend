import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { springFetch } from '@/lib/springApi'
import { useNotificationStore } from '@/store/notificationStore'

interface BookingResponse {
  bookingId: number
  clientName?: string
  bookedDate?: string
  bookedStartTime?: string
  status?: string
}

interface CounselorDashboard {
  todaySchedule?: BookingResponse[]
  pendingBookingCount?: number
  unreadNotificationCount?: number
}

interface ApiResponse<T> {
  data?: T
}

function formatSchedule(item: BookingResponse) {
  const date = item.bookedDate ?? '-'
  const time = item.bookedStartTime ? item.bookedStartTime.slice(0, 5) : ''
  return `${date}${time ? ` ${time}` : ''}`
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: '대기',
  ACCEPTED: '수락',
  REJECTED: '반려',
  CANCELLED: '취소',
  COMPLETED: '완료',
}

export default function CounselorDashboardPage() {
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount)
  const [dashboard, setDashboard] = useState<CounselorDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const res = await springFetch('/api/v1/dashboard/counselor')
        if (!res.ok) throw new Error('dashboard failed')
        const payload: ApiResponse<CounselorDashboard> = await res.json()
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

  return (
    <div className="min-h-full bg-neutral-50 p-4 md:p-8">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">상담사 대시보드</h1>
          <p className="text-sm text-neutral-500 mt-1">오늘 예약과 심사/알림 상태를 한 번에 확인하세요.</p>
        </div>

        {loading && <p className="text-sm text-neutral-500">불러오는 중...</p>}
        {error && <p className="text-sm text-semantic-error-text">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-white border border-neutral-100 p-4">
            <p className="text-sm text-neutral-500">대기 예약</p>
            <p className="text-2xl font-bold text-neutral-900 mt-2">{dashboard?.pendingBookingCount ?? 0}</p>
          </div>
          <div className="rounded-xl bg-white border border-neutral-100 p-4">
            <p className="text-sm text-neutral-500">읽지 않은 알림</p>
            <p className="text-2xl font-bold text-neutral-900 mt-2">{dashboard?.unreadNotificationCount ?? 0}</p>
          </div>
          <div className="rounded-xl bg-white border border-neutral-100 p-4">
            <p className="text-sm text-neutral-500">오늘 일정</p>
            <p className="text-2xl font-bold text-neutral-900 mt-2">{dashboard?.todaySchedule?.length ?? 0}</p>
          </div>
        </div>

        <div className="rounded-xl bg-white border border-neutral-100 p-4">
          <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <Bell size={18} className="text-primary-700" />
            오늘 상담 일정
          </h2>
          <div className="mt-3 divide-y divide-neutral-100">
            {(dashboard?.todaySchedule ?? []).length === 0 ? (
              <p className="py-6 text-sm text-neutral-500">오늘 예정된 상담이 없어요.</p>
            ) : (
              (dashboard?.todaySchedule ?? []).map((item) => (
                <div key={item.bookingId} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{item.clientName ?? '내담자'}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{formatSchedule(item)}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-primary-50 text-primary-700">
                    {STATUS_LABELS[item.status ?? ''] ?? item.status ?? '-'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
