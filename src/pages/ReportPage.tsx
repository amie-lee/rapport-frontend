import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { EmotionScoreCard } from '@/components/report/EmotionScoreCard'
import { CounselorRecommendCard } from '@/components/report/CounselorRecommendCard'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAuthStore } from '@/store/authStore'

const FALLBACK_EMOTIONS = [
  {
    label: '우울감',
    score: 73,
    barColorClass: 'bg-semantic-info-text',
  },
  {
    label: '불안감',
    score: 54,
    barColorClass: 'bg-accent-800',
  },
  {
    label: '스트레스',
    score: 25,
    barColorClass: 'bg-semantic-error-text',
  },
]

const FALLBACK_TOPICS = ['수면', '일상 피로', '대인관계']

const RECOMMENDED_COUNSELORS = [
  {
    name: '김서연',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800&auto=format&fit=crop',
    specialties: ['수면장애', '불안'],
  },
  {
    name: '박준혁',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop',
    specialties: ['불안', '우울'],
  },
  {
    name: '이도윤',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=800&auto=format&fit=crop',
    specialties: ['대인관계', '스트레스'],
  },
]

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

interface ApiResponse<T> {
  success?: boolean
  message?: string
  data?: T
}

function getApiBaseUrl() {
  return import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
}

function getRationale(scoreBasis: ReportDetail['scoreBasis'], key: 'depression' | 'anxiety' | 'stress') {
  const node = scoreBasis?.[key]
  if (!node || typeof node !== 'object') return undefined
  const rationale = (node as Record<string, unknown>).rationale
  return typeof rationale === 'string' ? rationale : undefined
}

export default function ReportPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { reportId } = useParams<{ reportId: string }>()
  const accessToken = useAuthStore((s) => s.accessToken)
  const fromMyReports = location.state != null && (location.state as { fromMyReports?: boolean }).fromMyReports === true
  const [report, setReport] = useState<ReportDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      if (!reportId) {
        setError('리포트 ID가 없습니다.')
        setLoading(false)
        return
      }

      const cached = sessionStorage.getItem(`report-detail:${reportId}`)
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as ReportDetail
          setReport(parsed)
          setLoading(false)
          return
        } catch {
          // ignore parse error and fetch from API
        }
      }

      if (!accessToken) {
        setError('로그인이 필요합니다.')
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`${getApiBaseUrl()}/api/v1/reports/${reportId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        if (!res.ok) throw new Error('report fetch failed')
        const payload: ApiResponse<ReportDetail> = await res.json()
        if (!payload?.data?.reportId) throw new Error('invalid report response')
        setReport(payload.data)
        sessionStorage.setItem(`report-detail:${payload.data.reportId}`, JSON.stringify(payload.data))
        setError(null)
      } catch {
        setError('리포트를 불러오지 못했어요.')
      } finally {
        setLoading(false)
      }
    }

    void run()
  }, [reportId, accessToken])

  const emotions = useMemo(() => {
    if (!report) return FALLBACK_EMOTIONS
    return [
      {
        label: '우울감',
        score: report.depressionScore,
        barColorClass: 'bg-semantic-info-text',
        rationale: getRationale(report.scoreBasis, 'depression'),
      },
      {
        label: '불안감',
        score: report.anxietyScore,
        barColorClass: 'bg-accent-800',
        rationale: getRationale(report.scoreBasis, 'anxiety'),
      },
      {
        label: '스트레스',
        score: report.stressScore,
        barColorClass: 'bg-semantic-error-text',
        rationale: getRationale(report.scoreBasis, 'stress'),
      },
    ]
  }, [report])

  const topics = report?.reportKeywords?.length ? report.reportKeywords : FALLBACK_TOPICS

  return (
    <div className="min-h-full bg-neutral-50 pb-10">
      {fromMyReports && <PageHeader title="리포트 상세" />}
      <div className="px-5 pt-4">
        <div className="rounded-sm border border-primary-200 bg-primary-50 px-4 py-4">
          <p className="text-h4-mobile font-bold text-neutral-900">오늘 대화를 마쳤어요</p>
          <p className="text-body-md text-neutral-800 mt-1">
            {report?.summary ?? '대화를 바탕으로 정리한 마음 상태 요약 리포트예요!'}
          </p>
        </div>
      </div>

      {loading && <p className="px-5 mt-4 text-caption text-neutral-400">리포트를 불러오는 중...</p>}
      {error && <p className="px-5 mt-4 text-caption text-semantic-error-text">{error}</p>}

      <section className="px-5 mt-6">
        <h2 className="text-h2-mobile font-bold text-neutral-900">지금 내가 느끼고 있는 감정들</h2>
        <div className="mt-3 flex flex-col gap-3">
          {emotions.map((emotion) => (
            <EmotionScoreCard key={emotion.label} {...emotion} />
          ))}
        </div>
      </section>

      <section className="px-5 mt-6">
        <h2 className="text-h2-mobile font-bold text-neutral-900">주로 이야기한 주제</h2>
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          {topics.map((topic) => (
            <span
              key={topic}
              className="inline-flex items-center rounded-full bg-primary-100 text-primary-600 text-small px-3 py-1"
            >
              {topic}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="px-5 text-h2-mobile font-bold text-neutral-900">
          함께하면 좋을 전문 분야의 상담사
        </h2>
        <div className="mt-3 flex gap-3 overflow-x-auto no-scrollbar px-5 pb-2">
          {RECOMMENDED_COUNSELORS.map((counselor) => (
            <CounselorRecommendCard key={counselor.name} {...counselor} />
          ))}
        </div>
      </section>

      {!fromMyReports && (
        <div className="px-5 mt-8">
          <Button size="lg" className="w-full rounded-sm" onClick={() => navigate('/dashboard')}>
            상담사 둘러보기
          </Button>
        </div>
      )}
    </div>
  )
}
