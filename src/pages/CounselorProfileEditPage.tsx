import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera } from 'lucide-react'
import { TopNavBar } from '@/components/ui/TopNavBar'
import { Button } from '@/components/ui/Button'
import { springFetch } from '@/lib/springApi'
import { useAuthStore } from '@/store/authStore'

type Gender = 'FEMALE' | 'MALE'
type ConsultationMode = 'FACE_TO_FACE' | 'ONLINE' | 'MEETING' | 'CALL'
type GenderLabel = '여성' | '남성'
type ConsultationModeLabel = '대면' | '비대면'

const SITUATIONS = [
  '대인관계', '자아/성격', '취업/진로', '가족', '정신건강',
  '연애', '육아/출산', '따돌림', '직장', '부부관계',
] as const
const SYMPTOMS = [
  '우울', '스트레스', '불안', '불면', '공황', 'PTSD', '콤플렉스',
  '자해', '분노조절', '조현병', '조울증', '중독', 'ADHD', '대인기피',
  '가스라이팅', '번아웃', '외로움',
] as const

type ApiResponse<T> = { data?: T }

interface CounselorProfileResponse {
  counselorGender?: Gender
  bio?: string
  specializations?: string[]
  symptoms?: string[]
  approaches?: string[]
  consultationModes?: ConsultationMode[]
  experienceYears?: number
  officeAddress?: string
  profileCompleted?: boolean
  requiredMissingFields?: string[]
}

function ChipGroup<T extends string>({ options, selected, multi = false, onChange }: {
  options: readonly T[]
  selected: T[]
  multi?: boolean
  onChange: (next: T[]) => void
}) {
  const toggle = (item: T) => {
    if (multi) {
      onChange(selected.includes(item) ? selected.filter((s) => s !== item) : [...selected, item])
    } else {
      onChange(selected[0] === item ? [] : [item])
    }
  }

  return (
    <div className="flex flex-wrap gap-[8px]">
      {options.map((opt) => {
        const active = selected.includes(opt)
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={active
              ? 'h-9 px-4 rounded-full border text-[13px] font-medium bg-[#e6f4ea] border-primary-600 text-primary-600 transition-colors'
              : 'h-9 px-4 rounded-full border text-[13px] font-medium bg-neutral-100 border-neutral-100 text-neutral-600 transition-colors'}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

const REQUIRED_FIELD_LABELS: Record<string, string> = {
  counselorGender: '성별',
  bio: '자기소개',
  specializations: '전문 분야',
  symptoms: '전문 증상',
  consultationModes: '상담 방식',
  experienceYears: '경력 연수',
  officeAddress: '상담실 주소',
}

export default function CounselorProfileEditPage() {
  const navigate = useNavigate()
  const imageRef = useRef<HTMLInputElement>(null)
  const user = useAuthStore((s) => s.user)

  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [gender, setGender] = useState<GenderLabel[]>([])
  const [consultationModes, setConsultationModes] = useState<ConsultationModeLabel[]>([])
  const [approaches, setApproaches] = useState<string[]>([])
  const [specializations, setSpecializations] = useState<string[]>([])
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [bio, setBio] = useState('')
  const [experienceYears, setExperienceYears] = useState('')
  const [officeAddress, setOfficeAddress] = useState('')
  const [requiredMissingFields, setRequiredMissingFields] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | undefined>()

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const res = await springFetch('/api/v1/counselor/profile')
        if (!res.ok) throw new Error('profile fetch failed')
        const payload: ApiResponse<CounselorProfileResponse> = await res.json()
        const profile = payload?.data
        if (!profile) return

        setGender(profile.counselorGender ? [profile.counselorGender === 'FEMALE' ? '여성' : '남성'] : [])
        const modeSource = profile.consultationModes?.length
          ? profile.consultationModes
          : (profile.approaches ?? []).filter((v) => v === 'MEETING' || v === 'CALL')
        setConsultationModes(
          modeSource.map((v) => (v === 'MEETING' || v === 'FACE_TO_FACE' ? '대면' : '비대면')),
        )
        setApproaches((profile.approaches ?? []).filter((v) => v !== 'MEETING' && v !== 'CALL'))
        setSpecializations(profile.specializations ?? [])
        setSymptoms(profile.symptoms ?? [])
        setBio(profile.bio ?? '')
        setExperienceYears(profile.experienceYears != null ? String(profile.experienceYears) : '')
        setOfficeAddress(profile.officeAddress ?? '')
        setRequiredMissingFields(profile.requiredMissingFields ?? [])
      } catch {
        setSubmitError('프로필 정보를 불러오지 못했어요.')
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [])

  const missingFieldText = useMemo(() => {
    const visibleMissing = requiredMissingFields.filter((field) => field !== 'approaches')
    if (visibleMissing.length === 0) return null
    return visibleMissing.map((field) => REQUIRED_FIELD_LABELS[field] ?? field).join(', ')
  }, [requiredMissingFields])

  const isValid =
    gender.length > 0 &&
    consultationModes.length > 0 &&
    specializations.length > 0 &&
    symptoms.length > 0 &&
    bio.trim().length > 0 &&
    experienceYears.trim().length > 0 &&
    officeAddress.trim().length > 0

  const handleSubmit = async () => {
    if (!isValid || submitting) return
    setSubmitting(true)
    setSubmitError(undefined)
    try {
      const years = Number(experienceYears)
      const payload = {
        counselorGender: gender[0] === '여성' ? 'FEMALE' : 'MALE',
        bio: bio.trim(),
        specializations,
        symptoms,
        approaches,
        consultationModes: consultationModes.map((v) => (v === '대면' ? 'FACE_TO_FACE' : 'ONLINE')),
        experienceYears: Number.isFinite(years) ? years : 0,
        officeAddress: officeAddress.trim(),
      }
      const res = await springFetch('/api/v1/counselor/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('update failed')
      navigate('/counselor/dashboard')
    } catch {
      setSubmitError('프로필 저장에 실패했어요.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="min-h-full bg-neutral-50 p-6 text-sm text-neutral-500">프로필 정보를 불러오는 중...</div>
  }

  const name = user?.name ? `${user.name} 상담사` : '상담사'

  return (
    <div className="min-h-full bg-neutral-50 p-4 md:p-8">
      <div className="max-w-[960px] mx-auto bg-white rounded-2xl border border-neutral-100">
        <div className="px-4 pt-3">
          <TopNavBar title="프로필 수정" onBack={() => navigate(-1)} />
        </div>

        <div className="px-6 py-6 border-b border-neutral-100 flex items-start gap-4">
          <button
            type="button"
            onClick={() => imageRef.current?.click()}
            className="relative w-[107px] h-[143px] rounded-[8px] bg-neutral-100 flex items-center justify-center overflow-hidden shrink-0"
            aria-label="프로필 이미지 선택"
          >
            {profileImage ? <img src={profileImage} alt="프로필" className="w-full h-full object-cover" /> : <Camera size={28} className="text-neutral-400" />}
          </button>
          <input ref={imageRef} type="file" accept="image/jpeg,image/png,image/jpg" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file) return
            setProfileImage(URL.createObjectURL(file))
            e.target.value = ''
          }} />
          <div className="flex-1">
            <p className="text-sm text-neutral-500">이름</p>
            <p className="text-base font-semibold text-neutral-900 mt-1">{name}</p>
            {missingFieldText && <p className="mt-3 text-caption text-semantic-warning-text">미완료 항목: {missingFieldText}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-neutral-900">성별</p>
            <ChipGroup<GenderLabel> options={['여성', '남성']} selected={gender} onChange={(v) => setGender(v as GenderLabel[])} />
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-neutral-900">상담 방식</p>
            <ChipGroup<ConsultationModeLabel> options={['대면', '비대면']} selected={consultationModes} multi onChange={(v) => setConsultationModes(v as ConsultationModeLabel[])} />
          </div>

          <div className="md:col-span-2 flex flex-col gap-3">
            <p className="text-sm font-semibold text-neutral-900">전문 분야</p>
            <ChipGroup<string> options={SITUATIONS} selected={specializations} multi onChange={setSpecializations} />
          </div>

          <div className="md:col-span-2 flex flex-col gap-3">
            <p className="text-sm font-semibold text-neutral-900">전문 증상</p>
            <ChipGroup<string> options={SYMPTOMS} selected={symptoms} multi onChange={setSymptoms} />
          </div>

          <label className="md:col-span-2 flex flex-col gap-2">
            <span className="text-sm font-semibold text-neutral-900">자기소개</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full rounded-[8px] border border-neutral-200 p-3 text-body-md focus:outline-none focus:border-primary-400"
              placeholder="상담 철학과 강점을 작성해 주세요."
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-neutral-900">경력 연수</span>
            <input
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value.replace(/\D/g, '').slice(0, 2))}
              className="w-full h-12 rounded-[8px] border border-neutral-200 px-3 text-body-md focus:outline-none focus:border-primary-400"
              placeholder="예: 7"
              inputMode="numeric"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-neutral-900">상담실 주소</span>
            <input
              value={officeAddress}
              onChange={(e) => setOfficeAddress(e.target.value)}
              className="w-full h-12 rounded-[8px] border border-neutral-200 px-3 text-body-md focus:outline-none focus:border-primary-400"
              placeholder="예: 서울시 강남구 ..."
            />
          </label>
        </div>

        {submitError && <p className="px-6 pb-4 text-caption text-semantic-error-text">{submitError}</p>}

        <div className="px-6 pb-6 flex justify-end">
          <Button type="button" size="lg" className="min-w-[180px]" disabled={!isValid || submitting} onClick={handleSubmit}>
            {submitting ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>
    </div>
  )
}
