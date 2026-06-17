import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopNavBar } from '@/components/ui/TopNavBar'
import { Button } from '@/components/ui/Button'
import { springFetch } from '@/lib/springApi'
import { useAuthStore } from '@/store/authStore'

interface SessionTypePrice {
  sessionTypeId: number
  name: string
  price: number
}

interface SlotResponse {
  scheduleId: number
  startTime: string
  endTime: string
  available?: boolean
  isAvailable?: boolean
}

interface DailyScheduleResponse {
  date?: string
  slotUnit?: number
  morning?: SlotResponse[]
  afternoon?: SlotResponse[]
}

interface ApiResponse<T> {
  data?: T
  message?: string
}

type Tab = 'basic' | 'repeat' | 'exception'

type TimeRange = { start: string; end: string }
type DayPattern = { enabled: boolean; ranges: TimeRange[] }

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

function dateToday() {
  return new Date().toISOString().slice(0, 10)
}

function addDays(base: Date, offset: number) {
  const d = new Date(base)
  d.setDate(d.getDate() + offset)
  return d
}

function toDateKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function isValidRange(range: TimeRange) {
  return range.start < range.end
}

function createInitialPattern(): Record<number, DayPattern> {
  return {
    0: { enabled: false, ranges: [{ start: '10:00', end: '14:00' }] },
    1: { enabled: true, ranges: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '18:00' }] },
    2: { enabled: true, ranges: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '18:00' }] },
    3: { enabled: true, ranges: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '18:00' }] },
    4: { enabled: true, ranges: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '18:00' }] },
    5: { enabled: true, ranges: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '18:00' }] },
    6: { enabled: false, ranges: [{ start: '10:00', end: '14:00' }] },
  }
}

export default function CounselorSchedulePage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const [tab, setTab] = useState<Tab>('basic')
  const [slotUnit, setSlotUnit] = useState<'30' | '60'>('60')
  const [settingsSaving, setSettingsSaving] = useState(false)

  const [date, setDate] = useState(dateToday())
  const [sessionTypes, setSessionTypes] = useState<SessionTypePrice[]>([])
  const [selectedSessionTypeIds, setSelectedSessionTypeIds] = useState<number[]>([])
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [creating, setCreating] = useState(false)

  const [weeklyPattern, setWeeklyPattern] = useState<Record<number, DayPattern>>(createInitialPattern)
  const [applyingPattern, setApplyingPattern] = useState(false)

  const [exceptionDate, setExceptionDate] = useState(dateToday())
  const [applyingException, setApplyingException] = useState(false)

  const [daily, setDaily] = useState<DailyScheduleResponse | null>(null)
  const [loadingDaily, setLoadingDaily] = useState(true)
  const [processingSlotId, setProcessingSlotId] = useState<number | null>(null)
  const [needsTimeUnitSetup, setNeedsTimeUnitSetup] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const slots = useMemo(
    () => [...(daily?.morning ?? []), ...(daily?.afternoon ?? [])],
    [daily],
  )

  const repeatPreview = useMemo(() => {
    const today = new Date()
    let rangesCount = 0
    let targetDays = 0
    for (let i = 0; i < 28; i += 1) {
      const d = addDays(today, i)
      const day = d.getDay()
      const pattern = weeklyPattern[day]
      if (!pattern?.enabled) continue
      const validRanges = pattern.ranges.filter(isValidRange)
      if (validRanges.length === 0) continue
      targetDays += 1
      rangesCount += validRanges.length
    }
    return {
      days: targetDays,
      createCount: rangesCount * Math.max(selectedSessionTypeIds.length, 0),
    }
  }, [weeklyPattern, selectedSessionTypeIds.length])

  const fetchSessionTypes = async () => {
    if (!user?.id) return
    try {
      const res = await springFetch(`/api/v1/counselors/${user.id}/session-types`)
      if (!res.ok) throw new Error('session type fetch failed')
      const payload: ApiResponse<SessionTypePrice[]> = await res.json()
      const list = payload?.data ?? []
      setSessionTypes(list)
      if (list.length > 0 && selectedSessionTypeIds.length === 0) {
        setSelectedSessionTypeIds([list[0].sessionTypeId])
      }
    } catch {
      setError('상담 유형 정보를 불러오지 못했어요.')
    }
  }

  const fetchDaily = async () => {
    setLoadingDaily(true)
    try {
      const res = await springFetch(`/api/v1/counselor/schedules/daily?date=${date}`)
      if (!res.ok) {
        if (res.status === 404) {
          const payload: ApiResponse<null> = await res.json().catch(() => ({}))
          if (payload?.message?.includes('슬롯 설정이 없습니다')) {
            setNeedsTimeUnitSetup(true)
            setDaily(null)
            setError(null)
            return
          }
        }
        throw new Error('daily failed')
      }
      const payload: ApiResponse<DailyScheduleResponse> = await res.json()
      setDaily(payload?.data ?? null)
      setNeedsTimeUnitSetup(false)
      if (payload?.data?.slotUnit) {
        setSlotUnit(String(payload.data.slotUnit) === '30' ? '30' : '60')
      }
      setError(null)
    } catch {
      setDaily(null)
      setNeedsTimeUnitSetup(false)
      setError('일정 목록을 불러오지 못했어요.')
    } finally {
      setLoadingDaily(false)
    }
  }

  useEffect(() => {
    void fetchSessionTypes()
  }, [user?.id])

  useEffect(() => {
    void fetchDaily()
  }, [date])

  const saveSlotUnit = async () => {
    if (settingsSaving) return
    setSettingsSaving(true)
    setError(null)
    setNotice(null)
    try {
      const body = JSON.stringify({ slotUnit: Number(slotUnit) })
      let res = await springFetch('/api/v1/counselor/schedule/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body,
      })
      if (!res.ok) {
        res = await springFetch('/api/v1/counselor/schedule/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        })
      }
      if (!res.ok) throw new Error('settings save failed')
      setNeedsTimeUnitSetup(false)
      setNotice('상담 시간 단위를 저장했어요.')
      await fetchDaily()
    } catch {
      setError('상담 시간 단위 저장에 실패했어요.')
    } finally {
      setSettingsSaving(false)
    }
  }

  const createSlot = async () => {
    if (creating || selectedSessionTypeIds.length === 0) return
    setCreating(true)
    setError(null)
    setNotice(null)
    try {
      let successCount = 0
      for (const sessionTypeId of selectedSessionTypeIds) {
        const res = await springFetch('/api/v1/counselor/schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slotDate: date,
            startTime,
            endTime,
            sessionTypeId,
          }),
        })
        if (res.ok) successCount += 1
      }
      if (successCount === 0) throw new Error('create slot failed')
      setNotice(`상담 가능 시간을 ${successCount}건 추가했어요.`)
      await fetchDaily()
    } catch {
      setError('상담 가능 시간 추가에 실패했어요. 시간/설정을 확인해 주세요.')
    } finally {
      setCreating(false)
    }
  }

  const applyPatternNext4Weeks = async () => {
    if (applyingPattern || selectedSessionTypeIds.length === 0) return
    setApplyingPattern(true)
    setError(null)
    setNotice(null)
    const today = new Date()
    let successCount = 0
    let failCount = 0
    try {
      for (let i = 0; i < 28; i += 1) {
        const d = addDays(today, i)
        const day = d.getDay()
        const pattern = weeklyPattern[day]
        if (!pattern?.enabled) continue
        const dateKey = toDateKey(d)
        const ranges = pattern.ranges.filter(isValidRange)
        for (const range of ranges) {
          for (const sessionTypeId of selectedSessionTypeIds) {
            const res = await springFetch('/api/v1/counselor/schedules', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                slotDate: dateKey,
                startTime: range.start,
                endTime: range.end,
                sessionTypeId,
              }),
            })
            if (res.ok) successCount += 1
            else failCount += 1
          }
        }
      }
      if (successCount === 0 && failCount > 0) {
        setError('반복 적용에 실패했어요. 기존 일정 충돌 여부를 확인해 주세요.')
      } else {
        setNotice(`다음 4주에 ${successCount}건 적용했어요.${failCount > 0 ? ` (${failCount}건 충돌/실패)` : ''}`)
        await fetchDaily()
      }
    } finally {
      setApplyingPattern(false)
    }
  }

  const applyException = async (mode: 'deactivate' | 'activate') => {
    if (applyingException) return
    setApplyingException(true)
    setError(null)
    setNotice(null)
    try {
      const res = await springFetch(`/api/v1/counselor/schedules/daily?date=${exceptionDate}`)
      if (!res.ok) throw new Error('daily exception fetch failed')
      const payload: ApiResponse<DailyScheduleResponse> = await res.json()
      const targetSlots = [...(payload?.data?.morning ?? []), ...(payload?.data?.afternoon ?? [])]

      let changed = 0
      for (const slot of targetSlots) {
        const active = slot.available ?? slot.isAvailable ?? true
        if ((mode === 'deactivate' && !active) || (mode === 'activate' && active)) continue
        const changeRes = await springFetch(`/api/v1/counselor/schedules/${slot.scheduleId}/${mode}`, {
          method: 'PATCH',
        })
        if (changeRes.ok) changed += 1
      }

      setNotice(
        mode === 'deactivate'
          ? `${exceptionDate}의 상담 가능 시간을 ${changed}건 비활성화했어요.`
          : `${exceptionDate}의 상담 가능 시간을 ${changed}건 활성화했어요.`,
      )
      if (exceptionDate === date) await fetchDaily()
    } catch {
      setError('예외 일정 처리에 실패했어요.')
    } finally {
      setApplyingException(false)
    }
  }

  const toggleSlot = async (slot: SlotResponse) => {
    if (processingSlotId != null) return
    const active = slot.available ?? slot.isAvailable ?? true
    const action = active ? 'deactivate' : 'activate'
    setProcessingSlotId(slot.scheduleId)
    setError(null)
    setNotice(null)
    try {
      const res = await springFetch(`/api/v1/counselor/schedules/${slot.scheduleId}/${action}`, {
        method: 'PATCH',
      })
      if (!res.ok) throw new Error('toggle failed')
      setNotice(active ? '상담 가능 시간을 비활성화했어요.' : '상담 가능 시간을 활성화했어요.')
      await fetchDaily()
    } catch {
      setError('상담 가능 시간 상태 변경에 실패했어요.')
    } finally {
      setProcessingSlotId(null)
    }
  }

  const deleteSlot = async (slotId: number) => {
    if (processingSlotId != null) return
    setProcessingSlotId(slotId)
    setError(null)
    setNotice(null)
    try {
      const res = await springFetch(`/api/v1/counselor/schedules/${slotId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('delete failed')
      setNotice('상담 가능 시간을 삭제했어요.')
      await fetchDaily()
    } catch {
      setError('상담 가능 시간 삭제에 실패했어요.')
    } finally {
      setProcessingSlotId(null)
    }
  }

  const toggleSessionType = (sessionTypeId: number) => {
    setSelectedSessionTypeIds((prev) =>
      prev.includes(sessionTypeId)
        ? prev.filter((id) => id !== sessionTypeId)
        : [...prev, sessionTypeId],
    )
  }

  const updatePattern = (day: number, next: Partial<DayPattern>) => {
    setWeeklyPattern((prev) => ({
      ...prev,
      [day]: { ...prev[day], ...next },
    }))
  }

  const updatePatternRange = (day: number, index: number, key: keyof TimeRange, value: string) => {
    setWeeklyPattern((prev) => {
      const current = prev[day]
      const ranges = current.ranges.map((range, i) => (i === index ? { ...range, [key]: value } : range))
      return {
        ...prev,
        [day]: { ...current, ranges },
      }
    })
  }

  const addPatternRange = (day: number) => {
    setWeeklyPattern((prev) => {
      const current = prev[day]
      if (current.ranges.length >= 3) return prev
      return {
        ...prev,
        [day]: { ...current, ranges: [...current.ranges, { start: '13:00', end: '18:00' }] },
      }
    })
  }

  const removePatternRange = (day: number, index: number) => {
    setWeeklyPattern((prev) => {
      const current = prev[day]
      if (current.ranges.length <= 1) return prev
      return {
        ...prev,
        [day]: { ...current, ranges: current.ranges.filter((_, i) => i !== index) },
      }
    })
  }

  return (
    <div className="min-h-full bg-neutral-50 p-4 md:p-8">
      <div className="max-w-[960px] mx-auto flex flex-col gap-4">
        <div className="rounded-xl border border-neutral-100 bg-white px-4 py-2">
          <TopNavBar title="스케줄 관리" onBack={() => navigate(-1)} />
        </div>

        <div className="rounded-xl border border-neutral-100 bg-white p-2 flex gap-2">
          {[
            { key: 'basic', label: '기본 설정' },
            { key: 'repeat', label: '반복 스케줄' },
            { key: 'exception', label: '예외' },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key as Tab)}
              className={`h-10 px-4 rounded-lg text-sm ${tab === item.key ? 'bg-primary-50 text-primary-700 font-medium' : 'text-neutral-600 hover:bg-neutral-50'}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-semantic-error-text">{error}</p>}
        {notice && <p className="text-sm text-semantic-info-text">{notice}</p>}

        {tab === 'basic' && (
          <>
            <div className="rounded-xl border border-neutral-100 bg-white p-4 flex flex-col gap-3">
              <p className="text-sm font-semibold text-neutral-900">1. 상담 시간 단위 설정</p>
              <p className="text-sm text-neutral-500">처음 한 번만 설정하면 됩니다. 이후에는 언제든 변경할 수 있어요.</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setSlotUnit('30')} className={`h-10 px-4 rounded-lg border ${slotUnit === '30' ? 'border-primary-600 text-primary-700 bg-primary-50' : 'border-neutral-200'}`}>30분</button>
                <button type="button" onClick={() => setSlotUnit('60')} className={`h-10 px-4 rounded-lg border ${slotUnit === '60' ? 'border-primary-600 text-primary-700 bg-primary-50' : 'border-neutral-200'}`}>60분</button>
                <Button size="md" onClick={() => void saveSlotUnit()} loading={settingsSaving}>저장</Button>
              </div>
            </div>

            {needsTimeUnitSetup && (
              <div className="rounded-xl border border-primary-200 bg-primary-50 p-4">
                <p className="text-sm font-semibold text-primary-800">먼저 상담 시간 단위를 설정해 주세요</p>
                <p className="text-sm text-primary-700 mt-1">30분 또는 60분을 선택하고 저장하면 일정 등록을 시작할 수 있어요.</p>
              </div>
            )}

            <div className="rounded-xl border border-neutral-100 bg-white p-4 flex flex-col gap-3">
              <p className="text-sm font-semibold text-neutral-900">2. 상담 가능 시간 추가</p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-neutral-600">날짜</span>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10 rounded-lg border border-neutral-200 px-3" />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-neutral-600">시작</span>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-10 rounded-lg border border-neutral-200 px-3" />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-neutral-600">종료</span>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-10 rounded-lg border border-neutral-200 px-3" />
                </label>
                <div className="flex flex-col gap-1 text-sm">
                  <span className="text-neutral-600">상담 유형(복수 선택)</span>
                  <div className="flex flex-wrap gap-2">
                    {sessionTypes.map((type) => {
                      const active = selectedSessionTypeIds.includes(type.sessionTypeId)
                      return (
                        <button
                          key={type.sessionTypeId}
                          type="button"
                          onClick={() => toggleSessionType(type.sessionTypeId)}
                          className={`h-10 px-3 rounded-lg border text-xs ${active ? 'border-primary-600 text-primary-700 bg-primary-50' : 'border-neutral-200 text-neutral-700'}`}
                        >
                          {type.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
              <Button
                size="lg"
                className="w-full"
                onClick={() => void createSlot()}
                loading={creating}
                disabled={selectedSessionTypeIds.length === 0 || needsTimeUnitSetup}
              >
                상담 가능 시간 추가
              </Button>
              {needsTimeUnitSetup && <p className="text-xs text-neutral-500">상담 시간 단위를 먼저 저장하면 버튼이 활성화됩니다.</p>}
            </div>

            <div className="rounded-xl border border-neutral-100 bg-white p-4">
              <p className="text-sm font-semibold text-neutral-900">{date} 상담 가능 시간</p>
              {loadingDaily ? (
                <p className="text-sm text-neutral-500 mt-3">불러오는 중...</p>
              ) : needsTimeUnitSetup ? (
                <p className="text-sm text-neutral-500 mt-3">상담 시간 단위를 설정하면 목록이 표시됩니다.</p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-neutral-500 mt-3">등록된 상담 가능 시간이 없어요.</p>
              ) : (
                <div className="mt-3 divide-y divide-neutral-100">
                  {slots.map((slot) => {
                    const active = slot.available ?? slot.isAvailable ?? true
                    return (
                      <div key={slot.scheduleId} className="py-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-neutral-900">{slot.startTime?.slice(0, 5)} - {slot.endTime?.slice(0, 5)}</p>
                          <p className="text-xs text-neutral-500">ID: {slot.scheduleId} · {active ? '활성' : '비활성'}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => void toggleSlot(slot)}
                            disabled={processingSlotId === slot.scheduleId}
                            className="h-8 px-3 rounded-md border border-neutral-200 text-sm"
                          >
                            {active ? '비활성' : '활성'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteSlot(slot.scheduleId)}
                            disabled={processingSlotId === slot.scheduleId}
                            className="h-8 px-3 rounded-md border border-semantic-error-text text-semantic-error-text text-sm"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'repeat' && (
          <>
            <div className="rounded-xl border border-neutral-100 bg-white p-4 flex flex-col gap-3">
              <p className="text-sm font-semibold text-neutral-900">요일별 반복 패턴</p>
              <p className="text-sm text-neutral-500">요일별 시간을 설정하고 다음 4주에 한 번에 적용하세요.</p>
              <div className="flex flex-wrap gap-2">
                {sessionTypes.map((type) => {
                  const active = selectedSessionTypeIds.includes(type.sessionTypeId)
                  return (
                    <button
                      key={type.sessionTypeId}
                      type="button"
                      onClick={() => toggleSessionType(type.sessionTypeId)}
                      className={`h-9 px-3 rounded-lg border text-xs ${active ? 'border-primary-600 text-primary-700 bg-primary-50' : 'border-neutral-200 text-neutral-700'}`}
                    >
                      {type.name}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-100 bg-white p-4">
              <div className="space-y-4">
                {Array.from({ length: 7 }).map((_, day) => {
                  const item = weeklyPattern[day]
                  return (
                    <div key={day} className="border border-neutral-100 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm font-medium text-neutral-900">
                          <input
                            type="checkbox"
                            checked={item.enabled}
                            onChange={(e) => updatePattern(day, { enabled: e.target.checked })}
                          />
                          {DAY_LABELS[day]}요일 운영
                        </label>
                        <button
                          type="button"
                          onClick={() => addPatternRange(day)}
                          className="text-xs text-primary-700"
                          disabled={!item.enabled || item.ranges.length >= 3}
                        >
                          시간대 추가
                        </button>
                      </div>

                      {item.enabled && (
                        <div className="mt-3 space-y-2">
                          {item.ranges.map((range, index) => (
                            <div key={`${day}-${index}`} className="flex items-center gap-2">
                              <input
                                type="time"
                                value={range.start}
                                onChange={(e) => updatePatternRange(day, index, 'start', e.target.value)}
                                className="h-9 rounded-lg border border-neutral-200 px-2 text-sm"
                              />
                              <span className="text-sm text-neutral-500">~</span>
                              <input
                                type="time"
                                value={range.end}
                                onChange={(e) => updatePatternRange(day, index, 'end', e.target.value)}
                                className="h-9 rounded-lg border border-neutral-200 px-2 text-sm"
                              />
                              {item.ranges.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removePatternRange(day, index)}
                                  className="h-9 px-2 text-xs text-semantic-error-text"
                                >
                                  삭제
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-100 bg-white p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-neutral-900">미리보기</p>
                <p className="text-sm text-neutral-600 mt-1">다음 4주 기준 {repeatPreview.days}일 · 최대 {repeatPreview.createCount}건 생성</p>
              </div>
              <Button
                size="md"
                onClick={() => void applyPatternNext4Weeks()}
                loading={applyingPattern}
                disabled={needsTimeUnitSetup || selectedSessionTypeIds.length === 0}
              >
                다음 4주 적용
              </Button>
            </div>
          </>
        )}

        {tab === 'exception' && (
          <>
            <div className="rounded-xl border border-neutral-100 bg-white p-4 flex flex-col gap-3">
              <p className="text-sm font-semibold text-neutral-900">특정 날짜 예외 처리</p>
              <p className="text-sm text-neutral-500">임시 휴무나 특정 날짜 조정을 한 번에 처리합니다.</p>

              <label className="flex flex-col gap-1 text-sm max-w-[220px]">
                <span className="text-neutral-600">대상 날짜</span>
                <input
                  type="date"
                  value={exceptionDate}
                  onChange={(e) => setExceptionDate(e.target.value)}
                  className="h-10 rounded-lg border border-neutral-200 px-3"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="md"
                  variant="outline"
                  onClick={() => void applyException('deactivate')}
                  loading={applyingException}
                  disabled={needsTimeUnitSetup}
                >
                  해당일 전체 비활성화
                </Button>
                <Button
                  size="md"
                  onClick={() => void applyException('activate')}
                  loading={applyingException}
                  disabled={needsTimeUnitSetup}
                >
                  해당일 전체 활성화
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
