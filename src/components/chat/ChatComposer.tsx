import { useEffect, useRef } from 'react'
import { SendHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatComposerProps {
  value: string
  placeholder?: string
  disabled?: boolean
  onChange: (value: string) => void
  onSend: () => void
  inputRef?: React.RefObject<HTMLTextAreaElement | null>
}

export function ChatComposer({
  value,
  placeholder,
  disabled = false,
  onChange,
  onSend,
  inputRef,
}: ChatComposerProps) {
  const canSend = !disabled && value.trim().length > 0
  const internalRef = useRef<HTMLTextAreaElement | null>(null)
  const textareaRef = inputRef ?? internalRef

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = '0px'
    const nextHeight = Math.min(el.scrollHeight, 128)
    el.style.height = `${nextHeight}px`
    el.style.overflowY = el.scrollHeight > 128 ? 'auto' : 'hidden'
  }, [value, textareaRef])

  return (
    <div className="flex items-end gap-2">
      <div className="min-h-12 flex-1 rounded-2xl bg-neutral-200 px-4 py-3 flex items-end">
        <textarea
          ref={textareaRef}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            if (e.shiftKey) return
            if (e.nativeEvent.isComposing) return
            if (!canSend) return
            e.preventDefault()
            onSend()
          }}
          className={cn(
            'w-full bg-transparent border-none outline-none resize-none text-body-md leading-6',
            disabled ? 'text-neutral-400' : 'text-neutral-900',
            'placeholder:text-neutral-400',
          )}
        />
      </div>

      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onSend}
        disabled={!canSend}
        className={cn(
          'h-10 w-10 rounded-full flex items-center justify-center transition-colors',
          canSend
            ? 'bg-primary-100 text-primary-600'
            : 'bg-neutral-200 text-neutral-400',
        )}
        aria-label="메시지 전송"
      >
        <SendHorizontal size={20} />
      </button>
    </div>
  )
}
