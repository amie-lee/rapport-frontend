import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopNavBar } from '@/components/ui/TopNavBar'
import { Button } from '@/components/ui/Button'
import { springFetch } from '@/lib/springApi'
import { useAuthStore } from '@/store/authStore'

interface SessionTypePrice {
  id?: number
  sessionTypeId: number
  name: string
  price: number
}

interface ApiResponse<T> {
  data?: T
}

export default function CounselorSessionTypeSettingsPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [items, setItems] = useState<SessionTypePrice[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      if (!user?.id) return
      setLoading(true)
      try {
        const res = await springFetch(`/api/v1/counselors/${user.id}/session-types`)
        if (!res.ok) throw new Error('fetch failed')
        const payload: ApiResponse<SessionTypePrice[]> = await res.json()
        setItems(payload?.data ?? [])
        setError(null)
      } catch {
        setError('상담 비용 정보를 불러오지 못했어요.')
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [user?.id])

  const handleChangePrice = (sessionTypeId: number, value: string) => {
    const numeric = Number(value.replace(/\D/g, ''))
    setItems((prev) => prev.map((item) => (
      item.sessionTypeId === sessionTypeId
        ? { ...item, price: Number.isFinite(numeric) ? numeric : 0 }
        : item
    )))
  }

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      const body = {
        items: items.map((item) => ({ sessionTypeId: item.sessionTypeId, price: item.price })),
      }
      const res = await springFetch('/api/v1/counselor/session-types', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('save failed')
      navigate(-1)
    } catch {
      setError('상담 비용 저장에 실패했어요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-full bg-neutral-50 p-4 md:p-8">
      <div className="max-w-[960px] mx-auto flex flex-col gap-4">
        <div className="rounded-xl border border-neutral-100 bg-white px-4 py-2">
          <TopNavBar title="상담 비용 설정" onBack={() => navigate(-1)} />
        </div>

        {loading && <p className="text-sm text-neutral-500">불러오는 중...</p>}
        {error && <p className="text-sm text-semantic-error-text">{error}</p>}

        <div className="rounded-xl border border-neutral-100 bg-white divide-y divide-neutral-100">
          {items.map((item) => (
            <div key={item.sessionTypeId} className="p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-neutral-900">{item.name}</p>
                <p className="text-xs text-neutral-500">유형 ID: {item.sessionTypeId}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={item.price}
                  onChange={(e) => handleChangePrice(item.sessionTypeId, e.target.value)}
                  className="w-[120px] h-10 rounded-lg border border-neutral-200 px-3 text-right text-sm"
                  inputMode="numeric"
                />
                <span className="text-sm text-neutral-600">원</span>
              </div>
            </div>
          ))}
          {!loading && items.length === 0 && (
            <p className="p-8 text-sm text-neutral-500 text-center">설정 가능한 상담 유형이 없어요.</p>
          )}
        </div>

        <Button size="lg" className="w-full" onClick={() => void handleSave()} disabled={saving || items.length === 0}>
          {saving ? '저장 중...' : '저장'}
        </Button>
      </div>
    </div>
  )
}
