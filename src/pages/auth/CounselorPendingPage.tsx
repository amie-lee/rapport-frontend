import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import logo from '@/assets/logo.svg'
import { springFetch } from '@/lib/springApi'
import { useAuthStore } from '@/store/authStore'

type StepStatus = 'done' | 'active' | 'upcoming'

interface Step {
  label: string
  status: StepStatus
}

const STEPS: Step[] = [
  { label: '회원가입 완료', status: 'done' },
  { label: '자격 증명 제출', status: 'done' },
  { label: '심사 대기 중', status: 'active' },
]

function StepIndicator({ steps }: { steps: Step[] }) {
  return (
    <div className="flex flex-col">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-start gap-[16px]">
          {/* 아이콘 + 연결선 */}
          <div className="flex flex-col items-center">
            {/* 아이콘 */}
            <div
              className={
                step.status === 'done'
                  ? 'w-[22px] h-[22px] rounded-full bg-primary-600 flex items-center justify-center shrink-0'
                  : step.status === 'active'
                  ? 'w-[22px] h-[22px] rounded-full border-[3px] border-primary-600 bg-white flex items-center justify-center shrink-0'
                  : 'w-[22px] h-[22px] rounded-full border-2 border-neutral-200 bg-white shrink-0'
              }
            >
              {step.status === 'done' && (
                <Check size={12} strokeWidth={3} className="text-white" />
              )}
              {step.status === 'active' && (
                <div className="w-[8px] h-[8px] rounded-full bg-primary-600" />
              )}
            </div>

            {/* 연결선 */}
            {i < steps.length - 1 && (
              <div className="w-[2px] h-[36px] bg-primary-100 my-[2px]" />
            )}
          </div>

          {/* 라벨 */}
          <div className="pt-[1px] pb-[36px] last:pb-0">
            <span
              className={
                step.status === 'active'
                  ? 'text-[14px] font-bold text-primary-600'
                  : step.status === 'done'
                  ? 'text-[14px] font-medium text-primary-900'
                  : 'text-[14px] font-medium text-neutral-400'
              }
            >
              {step.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function CounselorPendingPage() {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const [status, setStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | null>(null)
  const [rejectionReason, setRejectionReason] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const res = await springFetch('/api/v1/counselor/status')
        if (!res.ok) throw new Error('status failed')
        const payload = await res.json()
        setStatus(payload?.data?.approvalStatus ?? 'PENDING')
        setRejectionReason(payload?.data?.rejectionReason ?? null)
      } catch {
        setStatus('PENDING')
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [])

  const isApproved = status === 'APPROVED'
  const isRejected = status === 'REJECTED'

  async function handleReapply() {
    setProcessing(true)
    try {
      const res = await springFetch('/api/v1/counselor/reapply', { method: 'POST' })
      if (res.ok) {
        setStatus('PENDING')
        setRejectionReason(null)
      }
    } finally {
      setProcessing(false)
    }
  }

  function handleBackToLogin() {
    clearAuth()
    navigate('/counselor-login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-white flex justify-center">
      <div className="w-full max-w-[402px] px-6 flex flex-col min-h-screen">
      {/* 상단 로고 영역 */}
      <div className="flex flex-col items-center pt-[80px]">
        <img
          src={logo}
          alt="rapport 로고"
          className="w-[120px] h-[120px] object-contain"
        />
        <p
          className="text-[28px] leading-none text-primary-900 mt-[12px]"
          style={{ fontFamily: "'Share Tech Mono', monospace" }}
        >
          rapport
        </p>
      </div>

      {/* 진행 단계 */}
      <div className="flex justify-center mt-[64px]">
        <StepIndicator steps={STEPS} />
      </div>

      {/* 안내 카드 */}
      <div className="mt-[48px] bg-primary-50 rounded-[12px] px-[20px] py-[18px] flex flex-col gap-[6px]">
        {loading ? (
          <p className="text-[13px] text-primary-800">심사 상태를 확인하는 중이에요.</p>
        ) : isApproved ? (
          <>
            <p className="text-[14px] font-bold text-primary-900">승인이 완료됐어요</p>
            <p className="text-[13px] text-primary-800 leading-[1.6]">
              프로필을 작성하면 상담사 대시보드로 이동할 수 있어요.
            </p>
          </>
        ) : isRejected ? (
          <>
            <p className="text-[14px] font-bold text-primary-900">심사가 반려되었어요</p>
            <p className="text-[13px] text-primary-800 leading-[1.6]">
              {rejectionReason ? `사유: ${rejectionReason}` : '관리자 확인 후 다시 재신청해주세요.'}
            </p>
          </>
        ) : (
          <>
            <p className="text-[14px] font-bold text-primary-900">서류를 검토하고 있어요</p>
            <p className="text-[13px] text-primary-800 leading-[1.6]">
              보통 2~3 영업일이 소요돼요.{'\n'}
              심사가 완료되면 이메일로 알려드릴게요.
            </p>
          </>
        )}
      </div>

      {isApproved && (
        <div className="flex justify-center mt-6">
          <button
            type="button"
            onClick={() => navigate('/counselor-profile')}
            className="h-11 px-5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            프로필 작성하기
          </button>
        </div>
      )}
      {isRejected && (
        <div className="flex justify-center mt-6">
          <button
            type="button"
            onClick={() => void handleReapply()}
            disabled={processing}
            className="h-11 px-5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-60"
          >
            {processing ? '재신청 중...' : '재신청하기'}
          </button>
        </div>
      )}

      {/* 하단 링크 */}
      <div className="flex justify-center mt-auto pb-[48px] pt-[32px]">
        <button
          type="button"
          onClick={handleBackToLogin}
          className="text-[13px] text-neutral-400 hover:underline"
        >
          로그인 화면으로 돌아가기
        </button>
      </div>
      </div>
    </div>
  )
}
