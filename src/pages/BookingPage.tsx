import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/layout/PageHeader'
import { Divider } from '@/components/common/Divider'
import { DatePicker } from '@/components/booking/DatePicker'
import { TimeSlotPicker } from '@/components/booking/TimeSlotPicker'
import { AttachedReportCard } from '@/components/report/AttachedReportCard'
import { springFetch } from '@/lib/springApi'

type BookingStep = 'select' | 'confirm'

interface ApiResponse<T> {
  success?: boolean
  message?: string
  data?: T
}

interface CounselorSummary {
  userId: number
  name: string
}

interface SessionTypePrice {
  id: number
  sessionTypeId: number
  name: string
  price: number
}

interface ScheduleSlotResponse {
  scheduleId: number
  slotDate: string
  startTime: string
  endTime: string
  sessionTypeName?: string
  isAvailable?: boolean
  available?: boolean
}

interface DailyScheduleResponse {
  date: string
  slotUnit?: number
  morning?: ScheduleSlotResponse[]
  afternoon?: ScheduleSlotResponse[]
}

interface BookingResponse {
  bookingId: number
}

interface ReportSummary {
  reportId: number
  createdAt?: string
}

interface ReportPageResponse {
  content?: ReportSummary[]
}

interface ReportDetail {
  reportId: number
  summary?: string
  depressionScore?: number
  anxietyScore?: number
  stressScore?: number
  createdAt?: string
}

function formatDate(date: Date) {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

function formatDateQuery(date: Date) {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}

function mapConsultationModeLabel(mode: string) {
  if (mode === 'CALL' || mode === 'ONLINE') return '비대면(전화)'
  if (mode === 'MEETING' || mode === 'FACE_TO_FACE') return '대면'
  return mode
}

const STEP_LABELS: { id: BookingStep; label: string }[] = [
  { id: 'select', label: '날짜/시간 선택' },
  { id: 'confirm', label: '확인' },
]

export default function BookingPage() {
  const navigate = useNavigate()
  const { counselorId } = useParams<{ counselorId: string }>()
  const [step, setStep] = useState<BookingStep>('select')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [counselor, setCounselor] = useState<CounselorSummary | null>(null)
  const [sessionTypes, setSessionTypes] = useState<SessionTypePrice[]>([])
  const [selectedSessionTypeId, setSelectedSessionTypeId] = useState<number | null>(null)
  const [availableSlots, setAvailableSlots] = useState<ScheduleSlotResponse[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attachedReport, setAttachedReport] = useState<ReportSummary | null>(null)
  const [attachedReportDetail, setAttachedReportDetail] = useState<ReportDetail | null>(null)
  const [loadingReport, setLoadingReport] = useState(false)

  useEffect(() => {
    const run = async () => {
      if (!counselorId) return
      try {
        const [counselorRes, sessionTypeRes] = await Promise.all([
          springFetch(`/api/v1/counselors/${counselorId}`),
          springFetch(`/api/v1/counselors/${counselorId}/session-types`),
        ])
        if (counselorRes.ok) {
          const payload: ApiResponse<CounselorSummary> = await counselorRes.json()
          setCounselor(payload?.data ?? null)
        }
        if (sessionTypeRes.ok) {
          const payload: ApiResponse<SessionTypePrice[]> = await sessionTypeRes.json()
          const list = payload?.data ?? []
          setSessionTypes(list)
          if (list.length > 0) {
            setSelectedSessionTypeId(list[0].sessionTypeId)
          }
        }
      } catch {
        setError('예약 정보를 불러오지 못했어요.')
      }
    }
    void run()
  }, [counselorId])

  useEffect(() => {
    const run = async () => {
      if (!counselorId || !selectedDate) return
      setLoadingSlots(true)
      setSelectedTime(null)
      try {
        const date = formatDateQuery(selectedDate)
        const res = await springFetch(`/api/v1/counselors/${counselorId}/schedules/available?date=${date}`)
        if (!res.ok) throw new Error('slot failed')
        const payload: ApiResponse<DailyScheduleResponse> = await res.json()
        const daily = payload?.data
        const merged = [...(daily?.morning ?? []), ...(daily?.afternoon ?? [])]
        setAvailableSlots(merged)
        setError(null)
      } catch {
        setAvailableSlots([])
        setError('선택한 날짜의 가용 슬롯을 불러오지 못했어요.')
      } finally {
        setLoadingSlots(false)
      }
    }
    void run()
  }, [counselorId, selectedDate])

  useEffect(() => {
    const run = async () => {
      setLoadingReport(true)
      try {
        let targetReport: ReportSummary | null = null
        const listRes = await springFetch('/api/v1/reports?page=0&size=1')
        if (listRes.ok) {
          const listPayload: ApiResponse<ReportPageResponse> = await listRes.json().catch(() => ({}))
          const latestFromList = listPayload?.data?.content?.[0]
          if (latestFromList?.reportId) {
            targetReport = latestFromList
          }
        }
        if (!targetReport?.reportId) {
          setAttachedReport(null)
          setAttachedReportDetail(null)
          return
        }
        setAttachedReport(targetReport)
        const detailRes = await springFetch(`/api/v1/reports/${targetReport.reportId}`)
        if (detailRes.ok) {
          const detailPayload: ApiResponse<ReportDetail> = await detailRes.json().catch(() => ({}))
          setAttachedReportDetail(detailPayload?.data ?? null)
        } else {
          setAttachedReportDetail(null)
        }
      } catch {
        setAttachedReport(null)
        setAttachedReportDetail(null)
      } finally {
        setLoadingReport(false)
      }
    }
    void run()
  }, [])

  const selectedSessionType = useMemo(
    () => sessionTypes.find((s) => s.sessionTypeId === selectedSessionTypeId) ?? null,
    [sessionTypes, selectedSessionTypeId],
  )

  const timeOptions = useMemo(() => {
    if (!selectedSessionTypeId) return []
    const selectedName = selectedSessionType?.name
    const filtered = availableSlots
      .filter((slot) => {
        // Some backend responses do not include sessionTypeName on available-slot API.
        // In that case, do not filter out slots by session type.
        if (!selectedName) return true
        if (!slot.sessionTypeName) return true
        return slot.sessionTypeName === selectedName
      })
    const uniqueByRange = new Map<string, ScheduleSlotResponse>()
    for (const slot of filtered) {
      const key = `${slot.startTime}-${slot.endTime}`
      if (!uniqueByRange.has(key)) {
        uniqueByRange.set(key, slot)
      }
    }
    return Array.from(uniqueByRange.values())
      .map((slot) => ({
        key: String(slot.scheduleId),
        label: `${slot.startTime.slice(0, 5)} - ${slot.endTime.slice(0, 5)}`,
      }))
  }, [availableSlots, selectedSessionType, selectedSessionTypeId])

  const selectedSlot = useMemo(
    () => availableSlots.find((slot) => String(slot.scheduleId) === selectedTime) ?? null,
    [availableSlots, selectedTime],
  )

  function handleNext() {
    if (step === 'select') setStep('confirm')
    else void handleSubmit()
  }

  function handleBack() {
    if (step === 'confirm') setStep('select')
    else navigate(-1)
  }

  const canProceed =
    (step === 'select' && selectedDate !== null && selectedSessionTypeId !== null && selectedTime !== null) ||
    (step === 'confirm' && !submitting && !!attachedReport?.reportId)

  async function handleSubmit() {
    if (!counselorId || !selectedTime || !selectedSessionTypeId) return
    setSubmitting(true)
    try {
      const reportId = attachedReport?.reportId
      if (!reportId) {
        setError('예약에는 리포트 첨부가 필수입니다. 리포트를 먼저 생성해주세요.')
        return
      }

      const res = await springFetch('/api/v1/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          counselorId: Number(counselorId),
          scheduleId: Number(selectedTime),
          sessionTypeId: selectedSessionTypeId,
          reportId,
        }),
      })
      const payload: ApiResponse<BookingResponse> = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(payload?.message ?? '예약 생성 실패')
      }
      navigate('/sessions')
    } catch {
      setError('예약 생성에 실패했어요. 슬롯 상태를 확인하고 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title="예약하기" onBack={handleBack} />
      {error && <p className="px-5 py-3 text-caption text-semantic-error-text">{error}</p>}

      {/* Step indicator */}
      <div className="px-5 py-3 flex items-center gap-2">
        {STEP_LABELS.map((s, i) => (
          <span key={s.id} className="flex items-center gap-2">
            {i > 0 && (
              <span className="text-neutral-200 text-body-md">→</span>
            )}
            <span
              className={cn(
                'text-body-md',
                step === s.id
                  ? 'text-primary-600 font-medium'
                  : STEP_LABELS.findIndex((x) => x.id === step) > i
                  ? 'text-neutral-400 line-through'
                  : 'text-neutral-400',
              )}
            >
              {s.label}
            </span>
          </span>
        ))}
      </div>

      <Divider />

      {/* Step content */}
      <div className="px-5 py-5">
        {step === 'select' && (
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-body-md font-medium text-neutral-900 mb-2">상담사</p>
              <p className="text-body-md text-neutral-700">{counselor?.name ?? '상담사'}</p>
            </div>
            <div>
              <p className="text-body-md font-medium text-neutral-900 mb-2">상담 방식</p>
              <div className="flex flex-wrap gap-2">
                {sessionTypes.map((type) => {
                  const selected = type.sessionTypeId === selectedSessionTypeId
                  return (
                    <button
                      key={type.sessionTypeId}
                      type="button"
                      onClick={() => setSelectedSessionTypeId(type.sessionTypeId)}
                      className={cn(
                        'border rounded-full px-4 py-2 text-body-md transition-colors',
                        selected
                          ? 'border-primary-600 bg-primary-50 text-primary-600'
                          : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50',
                      )}
                    >
                      {mapConsultationModeLabel(type.name)} · {type.price.toLocaleString()}원
                    </button>
                  )
                })}
              </div>
            </div>
            <DatePicker value={selectedDate} onChange={setSelectedDate} />
            <div className="flex flex-col gap-3">
              <p className="text-body-md font-medium text-neutral-900">시간 선택</p>
              {!selectedDate ? (
                <p className="text-caption text-neutral-400">날짜를 먼저 선택해주세요.</p>
              ) : loadingSlots ? (
                <p className="text-caption text-neutral-400">가용 슬롯을 불러오는 중...</p>
              ) : timeOptions.length === 0 ? (
                <p className="text-caption text-neutral-400">선택한 날짜에 예약 가능한 슬롯이 없어요.</p>
              ) : (
                <TimeSlotPicker
                  slots={timeOptions}
                  value={selectedTime}
                  onChange={setSelectedTime}
                />
              )}
            </div>
          </div>
        )}

        {step === 'confirm' && selectedDate && selectedTime && (
          <div className="flex flex-col gap-5">
            {/* Summary */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-body-md text-neutral-600">상담사</span>
                <span className="text-body-md font-medium text-neutral-900">
                  {counselor?.name ?? '상담사'} 상담사
                </span>
              </div>
              <Divider />
              <div className="flex justify-between items-center">
                <span className="text-body-md text-neutral-600">날짜</span>
                <span className="text-body-md font-medium text-neutral-900">
                  {formatDate(selectedDate)}
                </span>
              </div>
              <Divider />
              <div className="flex justify-between items-center">
                <span className="text-body-md text-neutral-600">시간</span>
                <span className="text-body-md font-medium text-neutral-900">
                  {selectedSlot ? `${selectedSlot.startTime.slice(0, 5)} - ${selectedSlot.endTime.slice(0, 5)}` : '-'}
                </span>
              </div>
              <Divider />
              <div className="flex justify-between items-center">
                <span className="text-body-md text-neutral-600">상담 방식</span>
                <span className="text-body-md font-medium text-neutral-900">
                  {selectedSessionType ? mapConsultationModeLabel(selectedSessionType.name) : '-'}
                </span>
              </div>
            </div>

            <p className="text-caption text-neutral-600 mt-2">
              더 나은 상담 준비를 위해, 리포트 요약이 상담사에게 함께 전달됩니다.
            </p>
            <AttachedReportCard
              title="나의 리포트"
              required
              loading={loadingReport}
              attached={!!attachedReport?.reportId}
              createdAt={attachedReport?.createdAt}
              depressionScore={attachedReportDetail?.depressionScore}
              anxietyScore={attachedReportDetail?.anxietyScore}
              stressScore={attachedReportDetail?.stressScore}
            />
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="mt-auto px-5 pb-3 pt-3 bg-white border-t border-neutral-100">
        <Button
          variant="primary"
          size="lg"
          className="w-full rounded-lg"
          disabled={!canProceed}
          onClick={handleNext}
        >
          {step === 'confirm' ? (submitting ? '예약 생성 중...' : '예약 확정') : '다음'}
        </Button>
      </div>
    </div>
  )
}
