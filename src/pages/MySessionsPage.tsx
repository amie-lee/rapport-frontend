import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { springFetch } from '@/lib/springApi'

type SessionTab = 'upcoming' | 'completed'

interface BookingItem {
  bookingId: number
  counselorId?: number
  counselorName: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | string
  bookedDate?: string
  bookedStartTime?: string
}

interface ApiResponse<T> {
  success?: boolean
  data?: T
}

interface PageResponse<T> {
  content?: T[]
}

function mapStatusToBadge(status: BookingItem['status']): '확정' | '예정' | '취소' | '대기' {
  if (status === 'ACCEPTED') return '확정'
  if (status === 'PENDING') return '대기'
  if (status === 'REJECTED' || status === 'CANCELLED') return '취소'
  if (status === 'COMPLETED') return '확정'
  return '예정'
}

function formatBookingDateTime(bookedDate?: string, bookedStartTime?: string) {
  if (!bookedDate) return '-'
  const date = new Date(`${bookedDate}T00:00:00`)
  const weekday = date.toLocaleDateString('ko-KR', { weekday: 'short' })
  const [year, month, day] = bookedDate.split('-')
  const datePart = `${year}.${month}.${day} ${weekday}`
  if (!bookedStartTime) return datePart
  return `${datePart} ${bookedStartTime.slice(0, 5)}`
}

export default function MySessionsPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<SessionTab>('upcoming')
  const [bookings, setBookings] = useState<BookingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openingChatBookingId, setOpeningChatBookingId] = useState<number | null>(null)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const res = await springFetch('/api/v1/my/bookings?page=0&size=50')
        if (!res.ok) throw new Error('fetch failed')
        const payload: ApiResponse<PageResponse<BookingItem>> = await res.json()
        setBookings(payload?.data?.content ?? [])
        setError(null)
      } catch {
        setError('내 상담 목록을 불러오지 못했어요.')
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [])

  const filtered = useMemo(() => {
    return bookings.filter((b) =>
      activeTab === 'upcoming'
        ? b.status !== 'COMPLETED'
        : b.status === 'COMPLETED',
    )
  }, [bookings, activeTab])

  const openCounselorChatRoom = async (booking: BookingItem) => {
    if (openingChatBookingId != null) return
    setOpeningChatBookingId(booking.bookingId)
    setError(null)
    try {
      const roomsRes = await springFetch('/api/v1/chat/rooms')
      if (!roomsRes.ok) throw new Error('rooms fetch failed')
      const roomsPayload: ApiResponse<Array<{ roomId?: number; counselorId?: number; counselorName?: string }>> = await roomsRes.json()
      const rooms = roomsPayload?.data ?? []

      const matched = rooms.find((room) => {
        if (booking.counselorId && room.counselorId) {
          return room.counselorId === booking.counselorId
        }
        return !!room.counselorName && room.counselorName === booking.counselorName
      })
      if (matched?.roomId) {
        navigate(`/counselor/chat/${matched.roomId}`)
        return
      }

      const createBodies: Array<Record<string, number>> = []
      if (booking.counselorId) createBodies.push({ counselorId: booking.counselorId, bookingId: booking.bookingId })
      if (booking.counselorId) createBodies.push({ counselorId: booking.counselorId })
      createBodies.push({ bookingId: booking.bookingId })

      for (const body of createBodies) {
        const createRes = await springFetch('/api/v1/chat/rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!createRes.ok) continue
        const createPayload: ApiResponse<{ roomId?: number; id?: number }> = await createRes.json().catch(() => ({}))
        const roomId = createPayload?.data?.roomId ?? createPayload?.data?.id
        if (roomId) {
          navigate(`/counselor/chat/${roomId}`)
          return
        }
      }

      throw new Error('create room failed')
    } catch {
      setError('채팅방 입장에 실패했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setOpeningChatBookingId(null)
    }
  }

  return (
    <div className="flex flex-col">
      {/* Page title */}
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-h2-mobile font-bold text-neutral-900">내 상담</h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-100">
        {(['upcoming', 'completed'] as SessionTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            className={cn(
              'flex-1 py-3 text-body-md font-medium transition-colors',
              activeTab === tab
                ? 'text-primary-600 border-b-2 border-primary-600 -mb-px'
                : 'text-neutral-400',
            )}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'upcoming' ? '예정된 상담' : '완료된 상담'}
          </button>
        ))}
      </div>

      {/* Session list */}
      <div className="flex flex-col">
        {loading ? (
          <p className="text-center text-caption text-neutral-400 py-12">불러오는 중...</p>
        ) : error ? (
          <p className="text-center text-caption text-semantic-error-text py-12">{error}</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-caption text-neutral-400 py-12">
            {activeTab === 'upcoming'
              ? '예정된 상담이 없어요'
              : '완료된 상담이 없어요'}
          </p>
        ) : (
          filtered.map((session) => (
            <div
              key={session.bookingId}
              className="px-5 py-4 border-b border-neutral-100"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-body-md font-bold text-neutral-900">
                    {formatBookingDateTime(session.bookedDate, session.bookedStartTime)}
                  </span>
                  <span className="text-[16px] font-medium text-neutral-900">
                    {session.counselorName} 상담사
                  </span>
                </div>
                <Badge variant="status" status={mapStatusToBadge(session.status)}>
                  {mapStatusToBadge(session.status)}
                </Badge>
              </div>
              {session.status === 'COMPLETED' && (
                <button
                  type="button"
                  className="mt-2 text-body-md text-primary-600"
                  onClick={() => navigate(`/review/${session.bookingId}`)}
                >
                  리뷰 작성
                </button>
              )}
              {session.status === 'ACCEPTED' && (
                <button
                  type="button"
                  className="mt-2 text-body-md text-primary-600"
                  onClick={() => void openCounselorChatRoom(session)}
                  disabled={openingChatBookingId === session.bookingId}
                >
                  {openingChatBookingId === session.bookingId ? '채팅방 여는 중...' : '채팅방 입장'}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
