import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/layout/PageHeader'
import { Divider } from '@/components/common/Divider'

interface FormQuestion {
  id: string
  label: string
  type: 'text' | 'textarea'
  placeholder: string
}

interface FormSection {
  id: string
  title: string
  questions: FormQuestion[]
}

const SECTIONS: FormSection[] = [
  {
    id: 'reason',
    title: '상담 신청 이유',
    questions: [
      {
        id: 'main_concern',
        label: '현재 가장 힘든 점은 무엇인가요?',
        type: 'textarea',
        placeholder: '자유롭게 작성해주세요',
      },
      {
        id: 'duration',
        label: '이 문제가 언제부터 시작되었나요?',
        type: 'text',
        placeholder: '예: 약 3개월 전부터',
      },
      {
        id: 'goal',
        label: '상담을 통해 어떤 변화를 원하시나요?',
        type: 'textarea',
        placeholder: '상담 목표를 작성해주세요',
      },
    ],
  },
  {
    id: 'history',
    title: '상담 경험',
    questions: [
      {
        id: 'prev_counseling',
        label: '이전에 상담을 받은 경험이 있나요?',
        type: 'text',
        placeholder: '있다면 간략히 설명해주세요',
      },
      {
        id: 'prev_medication',
        label: '현재 복용 중인 약이 있나요?',
        type: 'text',
        placeholder: '있다면 약 이름을 작성해주세요',
      },
    ],
  },
  {
    id: 'concerns',
    title: '주요 고민',
    questions: [
      {
        id: 'relationship',
        label: '대인 관계에서 어려움을 느끼시나요?',
        type: 'textarea',
        placeholder: '구체적인 상황을 설명해주세요',
      },
      {
        id: 'daily_life',
        label: '일상생활에서 가장 어려운 부분은 무엇인가요?',
        type: 'textarea',
        placeholder: '수면, 식사, 업무 등 자유롭게 작성해주세요',
      },
      {
        id: 'support',
        label: '현재 주변에 도움을 받을 수 있는 사람이 있나요?',
        type: 'text',
        placeholder: '예: 가족, 친구, 동료 등',
      },
    ],
  },
]

export default function IntakeFormPage() {
  const navigate = useNavigate()
  const [currentSection, setCurrentSection] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const section = SECTIONS[currentSection]
  const progress = ((currentSection + 1) / SECTIONS.length) * 100

  function handleNext() {
    if (currentSection < SECTIONS.length - 1) {
      setCurrentSection((s) => s + 1)
    } else {
      navigate('/sessions')
    }
  }

  function handlePrev() {
    if (currentSection > 0) {
      setCurrentSection((s) => s - 1)
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title="접수면접지" />

      {/* Progress */}
      <div className="px-5 py-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-caption text-neutral-600">
            {currentSection + 1} / {SECTIONS.length} 섹션
          </span>
          <span className="text-caption text-primary-600">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-1 bg-primary-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-600 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      <Divider />

      {/* Section content */}
      <div className="px-5 py-5 flex flex-col gap-5">
        <h4 className="text-[16px] font-bold text-neutral-900">{section.title}</h4>

        {section.questions.map((q) => (
          <Input
            key={q.id}
            id={q.id}
            type={q.type}
            label={q.label}
            placeholder={q.placeholder}
            value={answers[q.id] ?? ''}
            onChange={(e) =>
              setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
            }
          />
        ))}
      </div>

      {/* Bottom nav */}
      <div className="mt-auto px-5 pb-3 pt-3 bg-white border-t border-neutral-100 flex gap-3">
        {currentSection > 0 && (
          <Button
            variant="outline"
            size="lg"
            className="flex-1 rounded-lg"
            onClick={handlePrev}
          >
            이전
          </Button>
        )}
        <Button
          variant="primary"
          size="lg"
          className={currentSection > 0 ? 'flex-1 rounded-lg' : 'w-full rounded-lg'}
          onClick={handleNext}
        >
          {currentSection === SECTIONS.length - 1 ? '제출' : '다음'}
        </Button>
      </div>
    </div>
  )
}
