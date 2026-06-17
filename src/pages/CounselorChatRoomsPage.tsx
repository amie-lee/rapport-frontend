import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopNavBar } from '@/components/ui/TopNavBar'
import { springFetch } from '@/lib/springApi'

interface RoomResponse {
  roomId: number
  clientId?: number
  clientName?: string
  counselorId?: number
  counselorName?: string
  status?: 'OPEN' | 'CLOSED' | string
  createdAt?: string
}

interface ApiResponse<T> {
  data?: T
}

export default function CounselorChatRoomsPage() {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState<RoomResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const res = await springFetch('/api/v1/chat/rooms')
        if (!res.ok) throw new Error('rooms fetch failed')
        const payload: ApiResponse<RoomResponse[]> = await res.json()
        setRooms(payload?.data ?? [])
        setError(null)
      } catch {
        setError('채팅방 목록을 불러오지 못했어요.')
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [])

  return (
    <div className="min-h-full bg-neutral-50 p-4 md:p-8">
      <div className="max-w-[960px] mx-auto flex flex-col gap-4">
        <div className="rounded-xl border border-neutral-100 bg-white px-4 py-2">
          <TopNavBar title="채팅방" onBack={() => navigate(-1)} />
        </div>

        {loading && <p className="text-sm text-neutral-500">불러오는 중...</p>}
        {error && <p className="text-sm text-semantic-error-text">{error}</p>}

        <div className="rounded-xl bg-white border border-neutral-100 divide-y divide-neutral-100">
          {!loading && rooms.length === 0 ? (
            <p className="text-center text-sm text-neutral-500 py-12">생성된 채팅방이 없어요.</p>
          ) : (
            rooms.map((room) => (
              <button
                key={room.roomId}
                type="button"
                onClick={() => navigate(`/counselor/chat/${room.roomId}`)}
                className="w-full p-4 text-left hover:bg-neutral-50 transition-colors"
              >
                <p className="text-sm font-semibold text-neutral-900">{room.clientName ?? `내담자 #${room.clientId ?? '-'}`}</p>
                <p className="text-xs text-neutral-500 mt-1">방 번호: {room.roomId} · 상태: {room.status ?? '-'}</p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
