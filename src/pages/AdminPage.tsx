import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { springFetch } from '@/lib/springApi'
import { useAuthStore } from '@/store/authStore'

type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

interface PendingCounselor {
  userId: number
  name: string
  email: string
  licenseType?: string
  licenseNumber?: string
  approvalStatus: ApprovalStatus
  appliedAt?: string
}

interface CounselorSummary extends PendingCounselor {
  rejectionReason?: string
  active?: boolean
}

interface PageResponse<T> {
  content?: T[]
}

interface ApiResponse<T> {
  data?: T
}

interface AdminDashboard {
  userStats?: {
    totalUsers?: number
    totalClients?: number
    totalCounselors?: number
  }
  counselorStats?: {
    pendingApproval?: number
    approvedCounselors?: number
    rejectedCounselors?: number
  }
}

function formatDateTime(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null)
  const [pending, setPending] = useState<PendingCounselor[]>([])
  const [allCounselors, setAllCounselors] = useState<CounselorSummary[]>([])
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending')
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [rejectOpenId, setRejectOpenId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [dashRes, pendingRes, allRes] = await Promise.all([
        springFetch('/api/v1/admin/dashboard'),
        springFetch('/api/v1/admin/counselors/pending?page=0&size=50'),
        springFetch('/api/v1/admin/counselors?page=0&size=50'),
      ])

      if (!dashRes.ok || !pendingRes.ok || !allRes.ok) {
        throw new Error('관리자 데이터 조회 실패')
      }

      const dashPayload: ApiResponse<AdminDashboard> = await dashRes.json()
      const pendingPayload: ApiResponse<PageResponse<PendingCounselor>> = await pendingRes.json()
      const allPayload: ApiResponse<PageResponse<CounselorSummary>> = await allRes.json()

      setDashboard(dashPayload?.data ?? null)
      setPending(pendingPayload?.data?.content ?? [])
      setAllCounselors(allPayload?.data?.content ?? [])
      setError(null)
    } catch {
      setError('관리자 페이지 정보를 불러오지 못했어요.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      navigate('/dashboard', { replace: true })
      return
    }
    void fetchData()
  }, [user?.role])

  const pendingCount = useMemo(
    () => pending.filter((item) => item.approvalStatus === 'PENDING').length,
    [pending],
  )

  const handleApprove = async (userId: number) => {
    if (processingId != null) return
    setProcessingId(userId)
    try {
      const res = await springFetch(`/api/v1/admin/counselors/${userId}/approve`, { method: 'PATCH' })
      if (!res.ok) throw new Error('approve failed')
      await fetchData()
    } catch {
      setError('승인 처리에 실패했어요.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (userId: number) => {
    if (processingId != null) return
    if (rejectReason.trim().length === 0) {
      setError('반려 사유를 입력해 주세요.')
      return
    }

    setProcessingId(userId)
    try {
      const res = await springFetch(`/api/v1/admin/counselors/${userId}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      })
      if (!res.ok) throw new Error('reject failed')
      setRejectOpenId(null)
      setRejectReason('')
      await fetchData()
    } catch {
      setError('반려 처리에 실패했어요.')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-8">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">관리자 회원 관리</h1>
          <p className="text-sm text-neutral-500 mt-1">상담사 심사 승인/반려를 처리할 수 있어요.</p>
        </div>

        {loading && <p className="text-sm text-neutral-500">불러오는 중...</p>}
        {error && <p className="text-sm text-semantic-error-text">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl bg-white border border-neutral-100 p-4">
            <p className="text-sm text-neutral-500">전체 회원</p>
            <p className="text-2xl font-bold text-neutral-900 mt-1">{dashboard?.userStats?.totalUsers ?? 0}</p>
          </div>
          <div className="rounded-xl bg-white border border-neutral-100 p-4">
            <p className="text-sm text-neutral-500">심사 대기</p>
            <p className="text-2xl font-bold text-neutral-900 mt-1">{dashboard?.counselorStats?.pendingApproval ?? pendingCount}</p>
          </div>
          <div className="rounded-xl bg-white border border-neutral-100 p-4">
            <p className="text-sm text-neutral-500">승인된 상담사</p>
            <p className="text-2xl font-bold text-neutral-900 mt-1">{dashboard?.counselorStats?.approvedCounselors ?? 0}</p>
          </div>
        </div>

        <div className="rounded-xl bg-white border border-neutral-100">
          <div className="flex border-b border-neutral-100">
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`flex-1 py-3 text-sm font-medium ${activeTab === 'pending' ? 'text-primary-700 border-b-2 border-primary-700 -mb-px' : 'text-neutral-500'}`}
            >
              심사 대기
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-3 text-sm font-medium ${activeTab === 'all' ? 'text-primary-700 border-b-2 border-primary-700 -mb-px' : 'text-neutral-500'}`}
            >
              전체 상담사
            </button>
          </div>

          <div className="divide-y divide-neutral-100">
            {(activeTab === 'pending' ? pending : allCounselors).length === 0 && !loading ? (
              <p className="text-center text-sm text-neutral-500 py-12">표시할 상담사가 없어요.</p>
            ) : (
              (activeTab === 'pending' ? pending : allCounselors).map((item) => (
                <div key={item.userId} className="p-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-neutral-900">{item.name}</p>
                      <p className="text-sm text-neutral-600">{item.email}</p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {item.licenseType ?? '자격종류 미입력'}
                        {item.licenseNumber ? ` · ${item.licenseNumber}` : ''}
                      </p>
                      <p className="text-xs text-neutral-500">신청일: {formatDateTime(item.appliedAt)}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-neutral-100 text-neutral-700">
                      {item.approvalStatus}
                    </span>
                  </div>

                  {item.approvalStatus === 'PENDING' && (
                    <div className="flex flex-col gap-2">
                      {rejectOpenId === item.userId && (
                        <div className="rounded-lg border border-neutral-200 p-2 flex flex-col gap-2">
                          <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={2}
                            placeholder="반려 사유를 입력해 주세요"
                            className="w-full rounded-md border border-neutral-200 px-2 py-2 text-sm focus:outline-none focus:border-primary-400"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setRejectOpenId(null)
                                setRejectReason('')
                              }}
                              className="h-8 px-3 rounded-md border border-neutral-200 text-sm"
                            >
                              취소
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleReject(item.userId)}
                              disabled={processingId === item.userId}
                              className="h-8 px-3 rounded-md bg-semantic-error-text text-white text-sm disabled:opacity-60"
                            >
                              반려 확정
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setRejectOpenId(item.userId)
                            setRejectReason('')
                          }}
                          disabled={processingId === item.userId}
                          className="h-9 px-4 rounded-lg border border-semantic-error-text text-semantic-error-text text-sm disabled:opacity-60"
                        >
                          반려
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleApprove(item.userId)}
                          disabled={processingId === item.userId}
                          className="h-9 px-4 rounded-lg bg-primary-600 text-white text-sm disabled:opacity-60"
                        >
                          승인
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
