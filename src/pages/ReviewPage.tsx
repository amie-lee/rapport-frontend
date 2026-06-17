import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/layout/PageHeader'
import { Divider } from '@/components/common/Divider'

const REVIEW_TAGS = [
  '공감을 잘 해줬어요',
  '전문적인 느낌이에요',
  '편안한 분위기예요',
  '솔직한 피드백이 좋았어요',
  '시간을 잘 지켜요',
  '또 만나고 싶어요',
]

const MOCK_SESSIONS: Record<string, { counselorName: string; dateTime: string }> = {
  s004: { counselorName: '김수연', dateTime: '2025.05.13 화 14:00' },
  s005: { counselorName: '박지훈', dateTime: '2025.05.06 화 15:00' },
}

export default function ReviewPage() {
  const navigate = useNavigate()
  const { sessionId } = useParams<{ sessionId: string }>()
  const session = MOCK_SESSIONS[sessionId ?? ''] ?? {
    counselorName: '상담사',
    dateTime: '',
  }

  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [comment, setComment] = useState('')

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  function handleSubmit() {
    navigate('/sessions')
  }

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title="리뷰 작성" />

      {/* Session info */}
      <div className="px-5 py-4">
        <p className="text-body-md font-medium text-neutral-900">
          {session.counselorName} 상담사
        </p>
        {session.dateTime && (
          <p className="text-caption text-neutral-400 mt-0.5">{session.dateTime}</p>
        )}
      </div>

      <Divider />

      <div className="px-5 py-5 flex flex-col gap-6">
        {/* Star rating */}
        <div>
          <h4 className="text-[16px] font-bold text-neutral-900 mb-3">
            전체적인 만족도
          </h4>
          <div
            className="flex gap-2"
            onMouseLeave={() => setHovered(0)}
          >
            {[1, 2, 3, 4, 5].map((star) => {
              const filled = star <= (hovered || rating)
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  aria-label={`별점 ${star}점`}
                  aria-pressed={star <= rating}
                >
                  <Star
                    size={28}
                    strokeWidth={0}
                    className={cn(
                      'transition-colors',
                      filled ? 'text-accent-400 fill-accent-400' : 'text-neutral-200 fill-neutral-200',
                    )}
                  />
                </button>
              )
            })}
          </div>
          {rating > 0 && (
            <p className="text-caption text-neutral-400 mt-1.5">
              {['', '아쉬웠어요', '별로였어요', '보통이에요', '좋았어요', '최고였어요'][rating]}
            </p>
          )}
        </div>

        <Divider />

        {/* Tag selection */}
        <div>
          <h4 className="text-[16px] font-bold text-neutral-900 mb-3">좋았던 점</h4>
          <div className="flex flex-wrap gap-2">
            {REVIEW_TAGS.map((tag) => (
              <Button
                key={tag}
                variant="chip"
                selected={selectedTags.includes(tag)}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Button>
            ))}
          </div>
        </div>

        <Divider />

        {/* Written feedback */}
        <div>
          <Input
            type="textarea"
            label="추가 의견 (선택)"
            placeholder="상담 경험을 자유롭게 작성해주세요"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            charCount={{ current: comment.length, max: 500 }}
          />
        </div>
      </div>

      {/* Bottom submit */}
      <div className="mt-auto px-5 pb-3 pt-3 bg-white border-t border-neutral-100">
        <Button
          variant="primary"
          size="lg"
          className="w-full rounded-lg"
          disabled={rating === 0}
          onClick={handleSubmit}
        >
          리뷰 등록
        </Button>
      </div>
    </div>
  )
}
