import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { springFetch } from '@/lib/springApi'

interface ReportSummary {
  reportId: number
  createdAt?: string
}

interface PageResponse<T> {
  content?: T[]
}

interface ApiResponse<T> {
  success?: boolean
  data?: T
}

function formatDate(value?: string) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function MyReportsPage() {
  const navigate = useNavigate()
  const [reports, setReports] = useState<ReportSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const res = await springFetch('/api/v1/reports?page=0&size=30')
        if (!res.ok) throw new Error('fetch failed')
        const payload: ApiResponse<PageResponse<ReportSummary>> = await res.json()
        setReports(payload?.data?.content ?? [])
        setError(null)
      } catch {
        setError('리포트 목록을 불러오지 못했어요.')
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [])

  const sorted = useMemo(
    () => [...reports].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()),
    [reports],
  )

  return (
    <div className="flex flex-col min-h-full bg-white">
      <PageHeader title="나의 리포트" />
      <div className="px-5 py-4 flex flex-col gap-3">
        {loading && <p className="text-caption text-neutral-400">불러오는 중...</p>}
        {error && <p className="text-caption text-semantic-error-text">{error}</p>}
        {!loading && !error && sorted.length === 0 && (
          <p className="text-caption text-neutral-400">아직 생성된 리포트가 없어요.</p>
        )}
        {sorted.map((report) => (
          <button
            key={report.reportId}
            type="button"
            onClick={() => navigate(`/report/${report.reportId}`, { state: { fromMyReports: true } })}
            className="w-full text-left px-0 py-2 border-b border-neutral-100"
          >
            <div className="flex flex-col gap-1 px-1 pb-3">
              <p className="text-body-md font-medium text-neutral-900">리포트 #{report.reportId}</p>
              <p className="text-caption text-neutral-500">{formatDate(report.createdAt)}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
