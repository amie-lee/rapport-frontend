import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { TopNavBar } from '@/components/ui/TopNavBar'
import { springFetch } from '@/lib/springApi'
import { useAuthStore } from '@/store/authStore'

interface MessageResponse {
  id?: number
  roomId?: number
  senderId?: number
  senderName?: string
  content?: string
  messageType?: 'TEXT' | 'IMAGE' | 'SYSTEM' | string
  sentAt?: string
}

interface HistoryResponse {
  roomId?: number
  messages?: MessageResponse[]
}

interface ApiResponse<T> {
  data?: T
}

function renderMessageWithLinks(content?: string) {
  if (!content) return null
  const parts = content.split(/(https?:\/\/[^\s]+)/g)
  return parts.map((part, idx) => {
    if (/^https?:\/\/[^\s]+$/.test(part)) {
      return (
        <a
          key={`${part}-${idx}`}
          href={part}
          target="_blank"
          rel="noreferrer"
          className="text-primary-700 underline break-all"
        >
          {part}
        </a>
      )
    }
    return <span key={`${part}-${idx}`}>{part}</span>
  })
}

export default function CounselorChatRoomPage() {
  const navigate = useNavigate()
  const { roomId } = useParams<{ roomId: string }>()
  const myUserId = Number(useAuthStore((s) => s.user?.id ?? 0))
  const [messages, setMessages] = useState<MessageResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef<HTMLDivElement | null>(null)

  const scrollToBottom = () => {
    if (!listRef.current) return
    listRef.current.scrollTop = listRef.current.scrollHeight
  }

  const fetchMessages = async (firstLoad = false) => {
    if (!roomId) return
    if (firstLoad) setLoading(true)
    try {
      const res = await springFetch(`/api/v1/chat/rooms/${roomId}/messages`)
      if (!res.ok) throw new Error('history failed')
      const payload: ApiResponse<HistoryResponse> = await res.json()
      setMessages(payload?.data?.messages ?? [])
      setError(null)
    } catch {
      setError('채팅 내역을 불러오지 못했어요.')
    } finally {
      if (firstLoad) setLoading(false)
    }
  }

  useEffect(() => {
    void fetchMessages(true)
  }, [roomId])

  useEffect(() => {
    if (!roomId) return
    const timer = setInterval(() => {
      void fetchMessages(false)
    }, 3000)
    return () => clearInterval(timer)
  }, [roomId])

  useEffect(() => {
    scrollToBottom()
  }, [messages.length])

  const sendMessage = async () => {
    const text = input.trim()
    if (!roomId || !text || sending) return
    setSending(true)
    setError(null)
    try {
      const optimistic: MessageResponse = {
        id: -Date.now(),
        roomId: Number(roomId),
        senderId: myUserId,
        senderName: '나',
        content: text,
        messageType: 'TEXT',
        sentAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, optimistic])
      setInput('')

      const bodies = [
        { content: text, messageType: 'TEXT' },
        { message: text, messageType: 'TEXT' },
        { content: text, type: 'TEXT' },
      ]

      let ok = false
      for (const body of bodies) {
        const res = await springFetch(`/api/v1/chat/rooms/${roomId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (res.ok) {
          ok = true
          break
        }
      }
      if (!ok) throw new Error('send failed')
      await fetchMessages(false)
    } catch {
      setInput(text)
      await fetchMessages(false)
      setError('메시지 전송에 실패했어요.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="h-full bg-neutral-50 p-4 md:p-6 overflow-hidden">
      <div className="max-w-[960px] mx-auto flex flex-col gap-4 h-full min-h-0">
        <div className="rounded-xl border border-neutral-100 bg-white px-4 py-2">
          <TopNavBar title={`채팅방 #${roomId ?? '-'}`} onBack={() => navigate(-1)} />
        </div>

        <div className="min-h-[20px]">
          {loading && <p className="text-sm text-neutral-500">불러오는 중...</p>}
          {error && <p className="text-sm text-semantic-error-text">{error}</p>}
        </div>

        <div
          ref={listRef}
          className="rounded-xl bg-white border border-neutral-100 p-4 flex-1 min-h-0 overflow-y-auto flex flex-col gap-3"
        >
          {messages.length === 0 && !loading ? (
            <p className="text-sm text-neutral-500">메시지가 없어요.</p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`max-w-[85%] rounded-lg px-3 py-2 ${
                msg.messageType === 'SYSTEM'
                  ? 'bg-neutral-100 text-neutral-700 self-center'
                  : msg.senderId === myUserId
                    ? 'bg-primary-600 text-white self-end'
                    : 'bg-primary-50 text-neutral-900 self-start'
              }`}>
                {msg.senderName && msg.messageType !== 'SYSTEM' && (
                  <p className={`text-[11px] mb-1 ${msg.senderId === myUserId ? 'text-white/80' : 'text-neutral-500'}`}>{msg.senderName}</p>
                )}
                <p className="text-sm whitespace-pre-wrap">{renderMessageWithLinks(msg.content)}</p>
                {msg.sentAt && (
                  <p className={`text-[10px] mt-1 ${msg.senderId === myUserId ? 'text-white/70' : 'text-neutral-400'}`}>{new Date(msg.sentAt).toLocaleString('ko-KR')}</p>
                )}
              </div>
            ))
          )}
        </div>

        <div className="rounded-xl border border-neutral-100 bg-white p-3 flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={2}
            placeholder="메시지를 입력하세요"
            className="flex-1 resize-none rounded-lg border border-neutral-200 p-3 text-sm focus:outline-none focus:border-primary-400"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void sendMessage()
              }
            }}
          />
          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={sending || input.trim().length === 0}
            className="h-11 px-4 rounded-lg bg-primary-600 text-white text-sm disabled:opacity-50"
          >
            {sending ? '전송중' : '전송'}
          </button>
        </div>
      </div>
    </div>
  )
}
