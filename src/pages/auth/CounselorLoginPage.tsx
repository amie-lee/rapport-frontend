import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { TopNavBar } from '@/components/ui/TopNavBar'
import { applyCounselorAuthFromTokenResponse, routeCounselorAfterLogin } from '@/lib/counselorFlow'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function CounselorLoginPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [submitting, setSubmitting] = useState(false)

  const emailError = emailTouched && email.length > 0 && !EMAIL_REGEX.test(email)
    ? '올바른 이메일 형식으로 입력해 주세요.'
    : undefined

  const isValid = EMAIL_REGEX.test(email) && password.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || submitting) return
    setError(undefined)
    setSubmitting(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:8080'}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        throw new Error('login failed')
      }
      const payload = await res.json()
      applyCounselorAuthFromTokenResponse(payload)
      await routeCounselorAfterLogin(navigate)
    } catch {
      setError('계정 정보가 올바르지 않아요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-white">
      {/* 네비게이션 바 */}
      <div className="px-[16px] pt-[8px]">
        <TopNavBar title="상담사 로그인" onBack={() => navigate(-1)} />
      </div>

      {/* 폼 */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col px-[29px] pt-[130px] gap-[48px]"
      >
        {/* 이메일 */}
        <Input
          id="email"
          label="이메일"
          type="text"
          placeholder="이메일 주소"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setEmailTouched(true)}
          error={emailError}
          autoComplete="email"
          inputMode="email"
        />

        {/* 비밀번호 */}
        <div className="flex flex-col gap-1">
          <Input
            id="password"
            label="비밀번호"
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error}
            autoComplete="current-password"
          />
          {/* 비밀번호 찾기 */}
          <div className="flex justify-end">
            <button
              type="button"
              className="text-[10px] text-neutral-600 hover:underline mt-1"
            >
              비밀번호 찾기
            </button>
          </div>
        </div>

        {/* 로그인 버튼 */}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={!isValid || submitting}
        >
          {submitting ? '로그인 중...' : '로그인'}
        </Button>

        {/* 회원가입 링크 */}
        <p className="text-center text-[10px] text-neutral-600">
          계정이 없으신가요?{' '}
          <button
            type="button"
            onClick={() => navigate('/counselor-signup')}
            className="text-[12px] font-medium text-primary-600 hover:underline"
          >
            회원가입
          </button>
        </p>
      </form>
    </div>
  )
}
