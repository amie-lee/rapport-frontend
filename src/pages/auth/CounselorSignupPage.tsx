import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { TopNavBar } from '@/components/ui/TopNavBar'
import { cn } from '@/lib/utils'
import { applyCounselorAuthFromTokenResponse } from '@/lib/counselorFlow'

const NAME_REGEX = /^[가-힣a-zA-Z\s]+$/
const PHONE_REGEX = /^01[0-9]-\d{3,4}-\d{4}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

export default function CounselorSignupPage() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [password, setPassword] = useState('')

  const [nameTouched, setNameTouched] = useState(false)
  const [phoneTouched, setPhoneTouched] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)
  const [codeTouched, setCodeTouched] = useState(false)

  // 이메일 인증 흐름 상태
  const [codeSent, setCodeSent] = useState(false)
  const [codeVerified, setCodeVerified] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const [verifyingCode, setVerifyingCode] = useState(false)
  const [codeMessage, setCodeMessage] = useState<string | undefined>()
  const [submitError, setSubmitError] = useState<string | undefined>()
  const [submitting, setSubmitting] = useState(false)

  const nameError = nameTouched && name.length > 0 && !NAME_REGEX.test(name)
    ? '이름에 특수문자나 초성은 입력할 수 없어요.'
    : undefined

  const phoneError = phoneTouched && phone.length > 0 && !PHONE_REGEX.test(phone)
    ? '올바른 전화번호 형식으로 입력해 주세요. (예: 010-1234-5678)'
    : undefined

  const emailError = emailTouched && email.length > 0 && !EMAIL_REGEX.test(email)
    ? '올바른 이메일 형식으로 입력해 주세요.'
    : undefined

  const codeError = codeTouched && codeSent && verificationCode.length > 0 && verificationCode.length < 6
    ? '인증 코드 6자리를 입력해 주세요.'
    : undefined

  const isValid =
    NAME_REGEX.test(name) &&
    EMAIL_REGEX.test(email) &&
    codeVerified &&
    password.length >= 8

  function readErrorCode(payload: unknown): string | undefined {
    if (!payload || typeof payload !== 'object') return undefined
    const data = payload as Record<string, unknown>
    const code = data.code ?? data.errorCode ?? (typeof data.data === 'object' && data.data ? (data.data as Record<string, unknown>).code : undefined)
    return typeof code === 'string' ? code : undefined
  }

  const handleSendCode = async () => {
    if (!EMAIL_REGEX.test(email)) {
      setEmailTouched(true)
      return
    }
    setSendingCode(true)
    setCodeMessage(undefined)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:8080'}/api/v1/auth/email/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        const code = readErrorCode(payload)
        if (code === 'EMAIL_ALREADY_VERIFIED') {
          setCodeSent(true)
          setCodeVerified(true)
          setCodeMessage('이미 인증된 이메일이에요.')
          return
        }
        throw new Error('send failed')
      }
      setCodeSent(true)
      setCodeVerified(false)
      setVerificationCode('')
      setCodeMessage('인증 코드가 발송됐어요. 이메일을 확인해 주세요.')
    } catch {
      setCodeMessage('인증 코드 발송에 실패했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setSendingCode(false)
    }
  }

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6 || verifyingCode) return
    setVerifyingCode(true)
    setCodeMessage(undefined)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:8080'}/api/v1/auth/email/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode }),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        const code = readErrorCode(payload)
        if (code === 'EMAIL_VERIFICATION_NOT_FOUND') {
          throw new Error('인증 요청 이력이 없어요. 인증 코드를 다시 받아주세요.')
        }
        if (code === 'EMAIL_VERIFICATION_EXPIRED') {
          throw new Error('인증 코드가 만료됐어요. 다시 요청해 주세요.')
        }
        if (code === 'EMAIL_VERIFICATION_INVALID') {
          throw new Error('인증 코드가 올바르지 않아요.')
        }
        if (code === 'EMAIL_NOT_VERIFIED') {
          throw new Error('이메일 인증이 완료되지 않았어요. 인증 코드를 다시 확인해 주세요.')
        }
        throw new Error('verify failed')
      }
      setCodeVerified(true)
      setCodeMessage('이메일 인증이 완료됐어요.')
    } catch (e) {
      setCodeVerified(false)
      setCodeMessage(e instanceof Error ? e.message : '인증 코드 검증에 실패했어요.')
    } finally {
      setVerifyingCode(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || submitting) return
    setSubmitting(true)
    setSubmitError(undefined)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:8080'}/api/v1/auth/counselor/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name: name.trim(),
        }),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        const code = readErrorCode(payload)
        if (code === 'EMAIL_VERIFICATION_NOT_FOUND') {
          throw new Error('이메일 인증 요청 이력이 없어요. 인증을 다시 진행해 주세요.')
        }
        if (code === 'EMAIL_VERIFICATION_EXPIRED') {
          throw new Error('이메일 인증이 만료됐어요. 인증 코드를 다시 받아주세요.')
        }
        if (code === 'EMAIL_NOT_VERIFIED') {
          throw new Error('이메일 인증이 완료되지 않았어요.')
        }
        if (code === 'EMAIL_VERIFICATION_INVALID') {
          throw new Error('인증 코드가 올바르지 않아요. 인증을 다시 진행해 주세요.')
        }
        throw new Error('signup failed')
      }
      const payload = await res.json()
      applyCounselorAuthFromTokenResponse(payload)
      navigate('/counselor-signup-complete')
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : '회원가입에 실패했어요. 입력값을 확인해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-white">
      {/* 네비게이션 바 */}
      <div className="px-[16px] pt-[8px]">
        <TopNavBar title="상담사 회원가입" onBack={() => navigate(-1)} />
      </div>

      {/* 폼 */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col px-[29px] pt-[50px] pb-[120px] gap-[40px]"
      >
        {/* 이름 */}
        <Input
          id="name"
          label="이름"
          type="text"
          placeholder="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setNameTouched(true)}
          error={nameError}
          autoComplete="name"
          inputMode="text"
        />

        {/* 전화번호 */}
        <Input
          id="phone"
          label="전화번호"
          type="text"
          placeholder="전화번호"
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          onBlur={() => setPhoneTouched(true)}
          error={phoneError}
          autoComplete="tel"
          inputMode="tel"
        />

        {/* 이메일 + 인증 버튼 */}
        <div className="flex flex-col gap-1 w-full">
          <label htmlFor="email" className="text-body-md font-medium text-neutral-800">
            이메일
          </label>
          <div className="relative flex items-center">
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="이메일 주소"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              className={cn(
                'w-full h-12 rounded-[6px] border bg-[#F9FAF9] px-4 pr-16 text-body-lg transition-colors placeholder:text-neutral-400 focus:outline-none',
                emailError
                  ? 'border-semantic-error-text focus:border-semantic-error-text'
                  : 'border-neutral-100 focus:border-primary-400',
                codeVerified && 'border-primary-400 bg-neutral-50 text-neutral-400',
              )}
              disabled={codeVerified}
            />
            <button
              type="button"
              onClick={handleSendCode}
              disabled={!EMAIL_REGEX.test(email) || codeVerified || sendingCode}
              className={cn(
                'absolute right-2 px-[10px] py-[5px] rounded-lg text-[10px] font-medium text-white transition-colors',
                codeVerified
                  ? 'bg-neutral-300 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-800 disabled:opacity-40 disabled:cursor-not-allowed',
              )}
            >
              {sendingCode ? '발송 중' : codeSent ? '재발송' : '인증'}
            </button>
          </div>
          {emailError && (
            <span className="text-caption text-semantic-error-text">{emailError}</span>
          )}
          {codeMessage && (
            <span className={cn('text-caption', codeVerified ? 'text-primary-600' : 'text-semantic-error-text')}>
              {codeMessage}
            </span>
          )}
        </div>

        {/* 인증 코드 */}
        <div className="flex flex-col gap-1 w-full">
          <label htmlFor="code" className="text-body-md font-medium text-neutral-800">
            인증 코드
          </label>
          <div className="relative flex items-center">
            <input
              id="code"
              type="text"
              inputMode="numeric"
              placeholder="인증 코드"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onBlur={() => setCodeTouched(true)}
              disabled={!codeSent || codeVerified}
              className={cn(
                'w-full h-12 rounded-[6px] border bg-[#F9FAF9] px-4 text-body-lg transition-colors placeholder:text-neutral-400 focus:outline-none disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed',
                codeError
                  ? 'border-semantic-error-text'
                  : 'border-neutral-100 focus:border-primary-400',
                codeVerified && 'border-primary-400',
              )}
            />
            {codeSent && !codeVerified && (
              <button
                type="button"
                onClick={handleVerifyCode}
                disabled={verificationCode.length < 6 || verifyingCode}
                className="absolute right-2 px-[10px] py-[5px] rounded-lg text-[10px] font-medium text-white bg-primary-600 hover:bg-primary-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {verifyingCode ? '확인 중' : '확인'}
              </button>
            )}
          </div>
          {codeError && (
            <span className="text-caption text-semantic-error-text">{codeError}</span>
          )}
        </div>

        {/* 비밀번호 */}
        <Input
          id="password"
          label="비밀번호"
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          helperText={password.length > 0 && password.length < 8 ? '8자 이상 입력해 주세요.' : undefined}
          error={password.length > 0 && password.length < 8 ? '8자 이상 입력해 주세요.' : undefined}
          autoComplete="new-password"
        />
        {submitError && <p className="text-caption text-semantic-error-text">{submitError}</p>}
      </form>

      {/* 하단 고정 완료 버튼 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[402px] px-[19px] pb-[34px] pt-[12px] bg-white">
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={!isValid || submitting}
          onClick={handleSubmit}
        >
          {submitting ? '가입 중...' : '완료'}
        </Button>
      </div>
    </div>
  )
}
