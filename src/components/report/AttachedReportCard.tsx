import { LabelBadge } from '@/components/common/LabelBadge'

interface AttachedReportCardProps {
  title?: string
  required?: boolean
  loading?: boolean
  attached?: boolean
  showStatus?: boolean
  createdAt?: string
  depressionScore?: number
  anxietyScore?: number
  stressScore?: number
}

export function AttachedReportCard({
  title = '첨부 리포트',
  required = false,
  loading = false,
  attached = false,
  showStatus = true,
  createdAt,
  depressionScore,
  anxietyScore,
  stressScore,
}: AttachedReportCardProps) {
  const hasScores =
    typeof depressionScore === 'number' ||
    typeof anxietyScore === 'number' ||
    typeof stressScore === 'number'

  return (
    <div className="border border-neutral-100 rounded-xl p-4 flex flex-col gap-2 bg-neutral-50">
      <div className="flex items-center justify-between">
        <span className="text-body-md font-medium text-neutral-900">{title}</span>
        {showStatus && (
          loading ? (
            <LabelBadge>확인 중...</LabelBadge>
          ) : attached ? (
            <LabelBadge>{required ? '첨부됨 (필수)' : '첨부됨'}</LabelBadge>
          ) : (
            <span className="text-caption text-semantic-error-text">
              {required ? '첨부 필요' : '리포트 없음'}
            </span>
          )
        )}
      </div>

      {!loading && hasScores && (
        <div className="flex flex-col gap-2">
          {[
            { label: '우울', value: depressionScore ?? 0, barClass: 'bg-semantic-info-text' },
            { label: '불안', value: anxietyScore ?? 0, barClass: 'bg-accent-800' },
            { label: '스트레스', value: stressScore ?? 0, barClass: 'bg-semantic-error-text' },
          ].map((item) => (
            <div key={item.label} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-small text-neutral-700">
                <span>{item.label}</span>
                <span>{item.value}</span>
              </div>
              <div className="h-1.5 rounded-full bg-neutral-200 overflow-hidden">
                <div
                  className={`h-full rounded-full ${item.barClass}`}
                  style={{ width: `${Math.max(0, Math.min(100, item.value))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && createdAt && (
        <p className="text-small text-neutral-400">
          생성일 {new Date(createdAt).toLocaleDateString('ko-KR')}
        </p>
      )}
    </div>
  )
}
