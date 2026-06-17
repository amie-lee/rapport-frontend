import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { TopNavBar } from '@/components/ui/TopNavBar'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

const NAME_REGEX = /^[가-힣a-zA-Z\s]+$/
const PHONE_REGEX = /^01[0-9]-\d{3,4}-\d{4}$/
const BIRTHDATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

export default function SignupPage() {
  const navigate = useNavigate()
  const accessToken = useAuthStore((s) => s.accessToken)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | ''>('')
  const [birthDate, setBirthDate] = useState('')
  const [nameTouched, setNameTouched] = useState(false)
  const [phoneTouched, setPhoneTouched] = useState(false)
  const [birthDateTouched, setBirthDateTouched] = useState(false)
  const [submitError, setSubmitError] = useState<string | undefined>()
  const [submitting, setSubmitting] = useState(false)

  const nameError = nameTouched && name.length > 0 && !NAME_REGEX.test(name)
    ? '이름에 특수문자나 초성은 입력할 수 없어요.'
    : undefined

  const phoneError = phoneTouched && phone.length > 0 && !PHONE_REGEX.test(phone)
    ? '올바른 전화번호 형식으로 입력해 주세요. (예: 010-1234-5678)'
    : undefined

  const birthDateError =
    birthDateTouched && birthDate.length > 0 && !BIRTHDATE_REGEX.test(birthDate)
      ? '생년월일 형식은 YYYY-MM-DD 입니다.'
      : undefined

  const isValid =
    name.trim().length > 0 &&
    NAME_REGEX.test(name) &&
    PHONE_REGEX.test(phone) &&
    (gender === 'MALE' || gender === 'FEMALE') &&
    BIRTHDATE_REGEX.test(birthDate)

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    if (!accessToken) {
      setSubmitError('로그인 정보가 만료되었어요. 다시 로그인해 주세요.')
      return
    }

    setSubmitting(true)
    setSubmitError(undefined)

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:8080'}/api/v1/users/me/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          phone,
          gender,
          birthDate,
        }),
      })

      if (!res.ok) {
        throw new Error('profile update failed')
      }

      const payload = await res.json()
      const onboardingCompleted = payload?.data?.onboardingCompleted === true
      navigate('/signup-complete', {
        replace: true,
        state: { nextPath: onboardingCompleted ? '/dashboard' : '/chat' },
      })
    } catch {
      setSubmitError('추가 정보 저장에 실패했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-white">
      {/* 네비게이션 바 */}
      <div className="px-[16px] pt-[8px]">
        <TopNavBar title="회원가입" onBack={() => navigate(-1)} />
      </div>

      {/* 폼 */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col flex-1 px-[29px] pt-[90px] pb-[100px] gap-[48px]"
        noValidate
      >
        {/* 이름 */}
        <Input
          id="name"
          label="이름"
          type="text"
          placeholder="이름"
          value={name}
          onChange={handleNameChange}
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
          onChange={handlePhoneChange}
          onBlur={() => setPhoneTouched(true)}
          error={phoneError}
          autoComplete="tel"
          inputMode="tel"
        />

        <div className="flex flex-col gap-1 w-full">
          <label className="text-body-md font-medium text-neutral-800">성별</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setGender('FEMALE')}
              className={cn(
                'h-12 rounded-[6px] border text-body-md transition-colors',
                gender === 'FEMALE'
                  ? 'border-primary-400 bg-primary-50 text-primary-800'
                  : 'border-neutral-100 bg-[#F9FAF9] text-neutral-700',
              )}
            >
              여성
            </button>
            <button
              type="button"
              onClick={() => setGender('MALE')}
              className={cn(
                'h-12 rounded-[6px] border text-body-md transition-colors',
                gender === 'MALE'
                  ? 'border-primary-400 bg-primary-50 text-primary-800'
                  : 'border-neutral-100 bg-[#F9FAF9] text-neutral-700',
              )}
            >
              남성
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1 w-full">
          <label htmlFor="birthDate" className="text-body-md font-medium text-neutral-800">
            생년월일
          </label>
          <input
            id="birthDate"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            onBlur={() => setBirthDateTouched(true)}
            className={cn(
              'w-full h-12 rounded-[6px] border bg-[#F9FAF9] px-4 text-body-lg focus:outline-none',
              birthDateError
                ? 'border-semantic-error-text focus:border-semantic-error-text'
                : 'border-neutral-100 focus:border-primary-400',
            )}
          />
          {birthDateError && (
            <span className="text-caption text-semantic-error-text">{birthDateError}</span>
          )}
        </div>

        {submitError && (
          <p className="text-caption text-semantic-error-text">{submitError}</p>
        )}
      </form>

      {/* 하단 고정 완료 버튼 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[402px] px-[19px] pb-[34px] pt-[12px] bg-white">
        <Button
          type="submit"
          size="lg"
          className={cn('w-full', !isValid && 'opacity-40 pointer-events-none')}
          disabled={!isValid || submitting}
          onClick={handleSubmit}
        >
          {submitting ? '저장 중...' : '완료'}
        </Button>
      </div>
    </div>
  )
}
