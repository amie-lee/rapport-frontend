import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { TopNavBar } from '@/components/ui/TopNavBar'
import { springFetch } from '@/lib/springApi'
import { useAuthStore } from '@/store/authStore'

interface UserInfo {
  id: number
  email: string
  name: string
  role: string
  profileImageUrl?: string
}

interface MyStats {
  totalSessions?: number
  completedSessions?: number
}

interface ApiResponse<T> {
  data?: T
}

export default function CounselorMyPage() {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const storeUser = useAuthStore((s) => s.user)

  const [user, setUser] = useState<UserInfo | null>(null)
  const [stats, setStats] = useState<MyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawPassword, setWithdrawPassword] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawError, setWithdrawError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const [meRes, statsRes] = await Promise.all([
          springFetch('/api/v1/auth/me'),
          springFetch('/api/v1/users/me/stats'),
        ])

        if (meRes.ok) {
          const payload: ApiResponse<UserInfo> = await meRes.json()
          setUser(payload?.data ?? null)
        }
        if (statsRes.ok) {
          const payload: ApiResponse<MyStats> = await statsRes.json()
          setStats(payload?.data ?? null)
        }
        setError(null)
      } catch {
        setError('마이페이지 정보를 불러오지 못했어요.')
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [])

  const displayName = user?.name || storeUser?.name || '상담사'
  const displayEmail = user?.email || storeUser?.email || '-'
  const sessionCount = stats?.totalSessions ?? stats?.completedSessions ?? 0

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await springFetch('/api/v1/auth/logout', { method: 'POST' })
    } catch {
      // ignore
    } finally {
      clearAuth()
      navigate('/login', { replace: true })
      setLoggingOut(false)
    }
  }

  async function handleWithdraw() {
    if (withdrawing) return
    setWithdrawing(true)
    setWithdrawError(null)
    try {
      const body = withdrawPassword.trim().length > 0
        ? JSON.stringify({ password: withdrawPassword })
        : JSON.stringify({})

      const res = await springFetch('/api/v1/users/me', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body,
      })

      if (!res.ok) throw new Error('withdraw failed')

      clearAuth()
      navigate('/login', { replace: true })
    } catch {
      setWithdrawError('회원탈퇴에 실패했어요. 비밀번호를 확인하거나 잠시 후 다시 시도해 주세요.')
    } finally {
      setWithdrawing(false)
    }
  }

  return (
    <div className="min-h-full bg-neutral-50 p-4 md:p-8">
      <div className="max-w-[960px] mx-auto flex flex-col gap-5">
        <div className="rounded-xl border border-neutral-100 bg-white px-4 py-2">
          <TopNavBar title="마이페이지" onBack={() => navigate(-1)} />
        </div>

        {loading && <p className="text-sm text-neutral-500">불러오는 중...</p>}
        {error && <p className="text-sm text-semantic-error-text">{error}</p>}

        <div className="rounded-xl border border-neutral-100 bg-white px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-50 overflow-hidden flex items-center justify-center text-primary-600 font-bold">
              {user?.profileImageUrl ? (
                <img src={user.profileImageUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span>{displayName.charAt(0)}</span>
              )}
            </div>
            <div>
              <p className="text-body-lg font-medium text-neutral-900">{displayName}</p>
              <p className="text-caption text-neutral-500">{displayEmail}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-100 bg-white px-5 py-4">
          <p className="text-sm text-neutral-500">누적 상담 횟수</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{sessionCount}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => navigate('/counselor/chat')}
          >
            채팅방 보기
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => navigate('/counselor/session-types')}
          >
            상담 비용 설정
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full md:col-span-2"
            onClick={() => navigate('/counselor/schedule')}
          >
            스케줄 관리
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            variant="ghost"
            size="lg"
            className="w-full border border-neutral-200"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
          >
            {loggingOut ? '로그아웃 중...' : '로그아웃'}
          </Button>

          <Button
            variant="ghost"
            size="lg"
            className="w-full border border-semantic-error-text text-semantic-error-text"
            onClick={() => {
              setWithdrawOpen(true)
              setWithdrawPassword('')
              setWithdrawError(null)
            }}
          >
            회원탈퇴
          </Button>
        </div>

        <Modal
          open={withdrawOpen}
          onClose={() => {
            if (withdrawing) return
            setWithdrawOpen(false)
          }}
          title="회원탈퇴"
          primaryLabel="탈퇴하기"
          secondaryLabel="취소"
          onPrimary={() => void handleWithdraw()}
          onSecondary={() => setWithdrawOpen(false)}
          loading={withdrawing}
        >
          <div className="flex flex-col gap-3">
            <p className="text-sm text-neutral-700">탈퇴 시 계정 정보는 익명 처리되며 되돌릴 수 없어요.</p>
            <p className="text-xs text-neutral-500">이메일 로그인 계정은 비밀번호 입력이 필요해요. 소셜 로그인 계정은 비워두고 진행할 수 있어요.</p>
            <input
              type="password"
              placeholder="비밀번호 (이메일 계정만 입력)"
              value={withdrawPassword}
              onChange={(e) => setWithdrawPassword(e.target.value)}
              className="w-full h-11 rounded-[8px] border border-neutral-200 px-3 text-sm focus:outline-none focus:border-primary-400"
            />
            {withdrawError && <p className="text-caption text-semantic-error-text">{withdrawError}</p>}
          </div>
        </Modal>
      </div>
    </div>
  )
}
