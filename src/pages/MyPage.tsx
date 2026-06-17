import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Divider } from '@/components/common/Divider'
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
  totalReports?: number
  completedSessions?: number
  reportsCount?: number
}

interface ApiResponse<T> {
  success?: boolean
  data?: T
}

export default function MyPage() {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const storeUser = useAuthStore((s) => s.user)

  const [user, setUser] = useState<UserInfo | null>(null)
  const [stats, setStats] = useState<MyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawPassword, setWithdrawPassword] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawError, setWithdrawError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  const displayName = user?.name || storeUser?.name || '사용자'
  const displayEmail = user?.email || storeUser?.email || '-'
  const sessionCount = stats?.totalSessions ?? stats?.completedSessions ?? 0
  const reportCount = stats?.totalReports ?? stats?.reportsCount ?? 0

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await springFetch('/api/v1/auth/logout', { method: 'POST' })
    } catch {
      // ignore network errors and clear local auth regardless
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

      if (!res.ok) {
        throw new Error('withdraw failed')
      }

      clearAuth()
      navigate('/login', { replace: true })
    } catch {
      setWithdrawError('회원탈퇴에 실패했어요. 비밀번호를 확인하거나 잠시 후 다시 시도해 주세요.')
    } finally {
      setWithdrawing(false)
    }
  }

  return (
    <div className="px-5 py-5 flex flex-col gap-5">
      {/* Page title */}
      <h2 className="text-h2-mobile font-bold text-neutral-900">마이페이지</h2>

      {loading && <p className="text-caption text-neutral-400">불러오는 중...</p>}
      {error && <p className="text-caption text-semantic-error-text">{error}</p>}

      <div className="rounded-xl border border-neutral-100 bg-white px-4 py-4">
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

      <div className="rounded-xl border border-neutral-100 bg-white px-4 py-4">
        <p className="text-body-md font-medium text-neutral-900">내 활동</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-neutral-50 px-3 py-3">
            <p className="text-small text-neutral-500">상담 횟수</p>
            <p className="text-h3-mobile font-bold text-neutral-900 mt-1">{sessionCount}</p>
          </div>
          <div className="rounded-lg bg-neutral-50 px-3 py-3">
            <p className="text-small text-neutral-500">리포트 수</p>
            <p className="text-h3-mobile font-bold text-neutral-900 mt-1">{reportCount}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-100 bg-white">
        <button
          type="button"
          onClick={() => navigate('/my/reports')}
          className="w-full text-left px-4 py-4 text-body-md text-neutral-900"
        >
          나의 리포트 보기
        </button>
        <Divider />
        <button
          type="button"
          onClick={() => navigate('/mypage/profile')}
          className="w-full text-left px-4 py-4 text-body-md text-neutral-900"
        >
          프로필 정보 수정
        </button>
      </div>

      <Button
        variant="ghost"
        size="lg"
        className="w-full border border-neutral-200"
        onClick={() => void handleLogout()}
        disabled={loggingOut}
      >
        {loggingOut ? '로그아웃 중...' : '로그아웃'}
      </Button>

      <button
        type="button"
        onClick={() => {
          setWithdrawOpen(true)
          setWithdrawPassword('')
          setWithdrawError(null)
        }}
        className="w-full text-center text-sm text-semantic-error-text hover:underline"
      >
        회원탈퇴
      </button>

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
          <p className="text-sm text-neutral-700">
            탈퇴 시 계정 정보는 익명 처리되며 되돌릴 수 없어요.
          </p>
          <p className="text-xs text-neutral-500">
            이메일 로그인 계정은 비밀번호 입력이 필요해요. 소셜 로그인 계정은 비워두고 진행할 수 있어요.
          </p>
          <input
            type="password"
            placeholder="비밀번호 (이메일 계정만 입력)"
            value={withdrawPassword}
            onChange={(e) => setWithdrawPassword(e.target.value)}
            className="w-full h-11 rounded-[8px] border border-neutral-200 px-3 text-sm focus:outline-none focus:border-primary-400"
          />
          {withdrawError && (
            <p className="text-caption text-semantic-error-text">{withdrawError}</p>
          )}
        </div>
      </Modal>
    </div>
  )
}
