import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChatProgressBar } from '@/components/chat/ChatProgressBar'
import { ChatBubble } from '@/components/chat/ChatBubble'
import { ChatComposer } from '@/components/chat/ChatComposer'
import { ChatCompletionModal } from '@/components/chat/ChatCompletionModal'
import { useAuthStore } from '@/store/authStore'

type Message = {
  id: string
  role: 'bot' | 'user'
  text: string
}

const TOTAL_STEP = 10
const BOT_REPLIES = [
  '보통 어떤 생각을 하느라 잠을 설치게 되는 것 같아요?',
  '그럴 때 몸에서 느껴지는 변화도 있나요?',
  '요즘 일상에서 가장 버거운 순간은 언제인가요?',
]

const INITIAL_MESSAGES: Message[] = [
  { id: 'bot-0', role: 'bot', text: '안녕하세요, 서영님! 요즘 고민되는 일 있어요?' },
]

interface SessionResponse {
  sessionId: number
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'
}

interface MeResponse {
  success?: boolean
  data?: {
    id?: number
  }
}

interface ApiResponse<T> {
  success?: boolean
  message?: string
  data?: T
}

interface ReportDetail {
  reportId: number
  sessionId: number
  depressionScore: number
  anxietyScore: number
  stressScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | string
  summary: string
  scoreBasis?: Record<string, unknown>
  reportKeywords?: string[]
  recommendedSpecializations?: string[]
  createdAt?: string
  isCrisisDetected?: boolean
}

function getApiBaseUrl() {
  return import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
}

function getAiApiBaseUrl() {
  return import.meta.env.VITE_AI_API_URL ?? 'http://localhost:8000'
}

export default function ChatPage() {
  const navigate = useNavigate()
  const { sessionId: rawSessionId } = useParams()
  const accessToken = useAuthStore((s) => s.accessToken)
  const setTokens = useAuthStore((s) => s.setTokens)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const requestGuardRef = useRef(false)
  const completedGuardRef = useRef(false)
  const completionTimeoutRef = useRef<number | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const composerInputRef = useRef<HTMLTextAreaElement | null>(null)
  const refreshInFlightRef = useRef<Promise<string | null> | null>(null)

  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [step, setStep] = useState(0)
  const [showCompletion, setShowCompletion] = useState(false)
  const [loadingSession, setLoadingSession] = useState(true)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [aiSessionId, setAiSessionId] = useState<string | null>(null)
  const [userId, setUserId] = useState<number | null>(null)
  const [sending, setSending] = useState(false)
  const [reportId, setReportId] = useState<number | null>(null)
  const [finalizeError, setFinalizeError] = useState<string | null>(null)
  const [reportGenerating, setReportGenerating] = useState(false)

  const title = useMemo(
    () => (step < 3 ? '지금 느끼는 감정을 편하게 알려주세요' : '지금 느끼는 마음을 편하게 알려주세요'),
    [step],
  )

  const disabledInput = showCompletion || step >= TOTAL_STEP

  async function refreshAccessToken(): Promise<string | null> {
    if (refreshInFlightRef.current) {
      return refreshInFlightRef.current
    }

    const task = (async () => {
      const { refreshToken } = useAuthStore.getState()
      if (!refreshToken) return null

      const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      })
      if (!res.ok) return null

      const payload = await res.json()
      const nextAccessToken =
        payload?.data?.accessToken ??
        payload?.accessToken
      const nextRefreshToken =
        payload?.data?.refreshToken ??
        payload?.refreshToken ??
        refreshToken

      if (!nextAccessToken) return null

      setTokens({
        accessToken: nextAccessToken,
        refreshToken: nextRefreshToken,
      })
      return nextAccessToken as string
    })()

    refreshInFlightRef.current = task
    try {
      return await task
    } finally {
      refreshInFlightRef.current = null
    }
  }

  async function springFetch(path: string, init?: RequestInit, canRetry = true): Promise<Response> {
    const { accessToken: latestAccessToken } = useAuthStore.getState()
    const res = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        ...(latestAccessToken ? { Authorization: `Bearer ${latestAccessToken}` } : {}),
      },
    })

    if (res.status !== 401 || !canRetry) {
      return res
    }

    const refreshedToken = await refreshAccessToken()
    if (!refreshedToken) {
      clearAuth()
      navigate('/login', { replace: true })
      throw new Error('token refresh failed')
    }

    return springFetch(path, init, false)
  }

  useEffect(() => {
    return () => {
      if (completionTimeoutRef.current) {
        window.clearTimeout(completionTimeoutRef.current)
      }
    }
  }, [])

  function openCompletionModalWithDelay() {
    if (completionTimeoutRef.current) {
      window.clearTimeout(completionTimeoutRef.current)
    }
    completionTimeoutRef.current = window.setTimeout(() => {
      setShowCompletion(true)
    }, 2000)
  }

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, loadingSession, sessionError])

  useEffect(() => {
    if (disabledInput || loadingSession) return
    composerInputRef.current?.focus()
  }, [disabledInput, loadingSession])

  useEffect(() => {
    if (requestGuardRef.current) return
    requestGuardRef.current = true

    const bootstrapSession = async () => {
      if (!accessToken) {
        setSessionError('로그인이 필요합니다.')
        setLoadingSession(false)
        navigate('/login', { replace: true })
        return
      }

      try {
        const aiApiBaseUrl = getAiApiBaseUrl()

        const meRes = await springFetch('/api/v1/auth/me')
        if (!meRes.ok) throw new Error('me fetch failed')
        const mePayload: MeResponse = await meRes.json()
        const resolvedUserId = mePayload?.data?.id
        if (!resolvedUserId) throw new Error('invalid me response')
        setUserId(resolvedUserId)

        if (rawSessionId) {
          const res = await springFetch(`/api/v1/chat/sessions/${rawSessionId}`)

          if (!res.ok) throw new Error('session fetch failed')
          const payload: ApiResponse<SessionResponse> = await res.json()
          const springId = payload?.data?.sessionId
          if (!springId) throw new Error('invalid session response')
          const storedAiSessionId = sessionStorage.getItem(`ai-session:${springId}`)
          if (storedAiSessionId) {
            setAiSessionId(storedAiSessionId)
          } else {
            const aiStartRes = await fetch(`${aiApiBaseUrl}/ai/session`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ consent: true, user_id: resolvedUserId }),
            })
            if (!aiStartRes.ok) throw new Error('ai session start failed')
            const aiStartPayload = await aiStartRes.json()
            if (!aiStartPayload?.session_id) throw new Error('invalid ai session')
            setAiSessionId(aiStartPayload.session_id)
            sessionStorage.setItem(`ai-session:${springId}`, aiStartPayload.session_id)
            if (aiStartPayload.initial_message) {
              setMessages([{ id: 'bot-0', role: 'bot', text: String(aiStartPayload.initial_message) }])
            }
          }
        } else {
          const res = await springFetch('/api/v1/chat/sessions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ consentAgreed: true }),
          })

          if (!res.ok) throw new Error('session start failed')
          const payload: ApiResponse<SessionResponse> = await res.json()
          const createdSessionId = payload?.data?.sessionId
          if (!createdSessionId) throw new Error('invalid session start response')
          const aiStartRes = await fetch(`${aiApiBaseUrl}/ai/session`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ consent: true, user_id: resolvedUserId }),
          })
          if (!aiStartRes.ok) throw new Error('ai session start failed')
          const aiStartPayload = await aiStartRes.json()
          if (!aiStartPayload?.session_id) throw new Error('invalid ai session')
          setAiSessionId(aiStartPayload.session_id)
          sessionStorage.setItem(`ai-session:${createdSessionId}`, aiStartPayload.session_id)
          if (aiStartPayload.initial_message) {
            setMessages([{ id: 'bot-0', role: 'bot', text: String(aiStartPayload.initial_message) }])
          }

          navigate(`/chat/${createdSessionId}`, { replace: true })
        }

        setSessionError(null)
      } catch {
        setSessionError('채팅 세션을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.')
      } finally {
        setLoadingSession(false)
      }
    }

    void bootstrapSession()
  }, [accessToken, navigate, rawSessionId])

  useEffect(() => {
    if (!showCompletion || completedGuardRef.current) return
    if (!rawSessionId || !accessToken || !aiSessionId || !userId) return

    completedGuardRef.current = true

    const completeSession = async () => {
      let finalizeOk = false
      setFinalizeError(null)
      setReportGenerating(true)
      try {
        const finalizeRes = await fetch(`${getAiApiBaseUrl()}/ai/finalize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: aiSessionId,
            spring_session_id: Number(rawSessionId),
            user_id: userId,
          }),
        })
        finalizeOk = finalizeRes.ok
        if (!finalizeRes.ok) {
          const text = await finalizeRes.text().catch(() => '')
          console.error('[chat] finalize failed', finalizeRes.status, text)
          setFinalizeError('리포트 생성 서버 연결에 실패했어요. 잠시 후 다시 시도해 주세요.')
        }
      } catch (error) {
        console.error('[chat] finalize request error', error)
        setFinalizeError('리포트 생성 요청 중 오류가 발생했어요.')
      }

      if (!finalizeOk) {
        setReportGenerating(false)
        return
      }

      try {
        const reportRes = await springFetch(`/api/v1/reports/session/${rawSessionId}`)
        if (reportRes.ok) {
          const reportPayload: ApiResponse<ReportDetail> = await reportRes.json()
          const resolvedReportId = reportPayload?.data?.reportId
          if (typeof resolvedReportId === 'number') {
            setReportId(resolvedReportId)
            sessionStorage.setItem(`report-detail:${resolvedReportId}`, JSON.stringify(reportPayload.data))
            setFinalizeError(null)
          }
        } else {
          const text = await reportRes.text().catch(() => '')
          console.error('[chat] report by session fetch failed', reportRes.status, text)
          setFinalizeError('리포트를 아직 불러올 수 없어요. 잠시 후 다시 시도해 주세요.')
        }
      } catch (error) {
        console.error('[chat] report by session request error', error)
        setFinalizeError('리포트 조회 중 오류가 발생했어요.')
      } finally {
        setReportGenerating(false)
      }
    }

    void completeSession()
  }, [showCompletion, rawSessionId, accessToken, aiSessionId, userId])

  async function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || disabledInput || loadingSession || sessionError || !aiSessionId || sending) return

    setSending(true)
    const nextStep = Math.min(step + 1, TOTAL_STEP)
    const optimisticMessages: Message[] = [
      ...messages,
      { id: `user-${Date.now()}`, role: 'user', text: trimmed },
    ]
    setMessages(optimisticMessages)
    setInput('')

    try {
      const aiTurnRes = await fetch(`${getAiApiBaseUrl()}/ai/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: aiSessionId,
          message: trimmed,
        }),
      })
      if (!aiTurnRes.ok) throw new Error('ai message failed')
      const aiTurnPayload = await aiTurnRes.json()
      const replyText = String(aiTurnPayload?.reply ?? BOT_REPLIES[(nextStep - 1) % BOT_REPLIES.length])
      const isFinal = aiTurnPayload?.is_final === true

      setMessages((prev) => [...prev, { id: `bot-${Date.now() + 1}`, role: 'bot', text: replyText }])
      setStep(isFinal ? TOTAL_STEP : nextStep)
      if (isFinal || nextStep === TOTAL_STEP) {
        openCompletionModalWithDelay()
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `bot-${Date.now() + 1}`, role: 'bot', text: BOT_REPLIES[(nextStep - 1) % BOT_REPLIES.length] },
      ])
      setStep(nextStep)
      if (nextStep === TOTAL_STEP) {
        openCompletionModalWithDelay()
      }
    } finally {
      setSending(false)
      composerInputRef.current?.focus()
    }
  }

  return (
    <div className="relative h-full min-h-0 bg-neutral-50 overflow-hidden">
      <div className="absolute top-0 inset-x-0 z-20 px-4 pt-4 pb-3 bg-neutral-50">
        <div className="mb-3">
          <ChatProgressBar current={step} total={TOTAL_STEP} />
        </div>
        {step <= 4 && (
          <p className="text-center text-primary-400 text-body-md font-medium">{title}</p>
        )}
      </div>

      <div
        ref={scrollContainerRef}
        className="absolute inset-x-0 top-[76px] bottom-[76px] overflow-y-auto px-4 pb-4"
      >
        {loadingSession && (
          <p className="text-caption text-neutral-400">채팅 세션을 준비하고 있어요...</p>
        )}
        {sessionError && (
          <p className="text-caption text-semantic-error-text">{sessionError}</p>
        )}
        <div className="flex flex-col gap-7">
          {messages.map((message) => (
            <ChatBubble key={message.id} role={message.role} message={message.text} />
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 z-20 px-4 pt-2 pb-4 bg-neutral-50">
        <ChatComposer
          inputRef={composerInputRef}
          value={input}
          disabled={disabledInput || loadingSession || !!sessionError || sending}
          placeholder={disabledInput ? '' : '마음 속 이야기를 들려주세요'}
          onChange={setInput}
          onSend={handleSend}
        />
        {rawSessionId && <p className="sr-only">세션: {rawSessionId}</p>}
      </div>

      <ChatCompletionModal
        open={showCompletion}
        description={finalizeError ?? undefined}
        confirmDisabled={!reportId || reportGenerating}
        loading={reportGenerating}
        onConfirm={() => {
          if (!reportId) return
          navigate(`/report/${reportId}`)
        }}
      />
    </div>
  )
}
