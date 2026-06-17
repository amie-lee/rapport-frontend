import { Button } from '@/components/ui/Button'

interface ChatCompletionModalProps {
  open: boolean
  onConfirm: () => void
  description?: string
  confirmDisabled?: boolean
  loading?: boolean
}

export function ChatCompletionModal({
  open,
  onConfirm,
  description,
  confirmDisabled = false,
  loading = false,
}: ChatCompletionModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-900/35 backdrop-blur-[1px] px-6">
      <div className="w-full max-w-[322px] rounded-md bg-white p-5 shadow-lg">
        <p className="text-center text-h3-mobile font-medium text-neutral-900">
          지금 나의 마음 상태를 확인해볼까요?
        </p>
        {description && (
          <p className="mt-2 text-center text-caption text-semantic-error-text">
            {description}
          </p>
        )}
        <Button
          size="lg"
          className="w-full mt-5 rounded-sm"
          onClick={onConfirm}
          disabled={confirmDisabled || loading}
          loading={loading}
        >
          {loading ? '리포트 생성중...' : '리포트 확인하기'}
        </Button>
      </div>
    </div>
  )
}
