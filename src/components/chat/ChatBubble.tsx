import { cn } from '@/lib/utils'

interface ChatBubbleProps {
  role: 'bot' | 'user'
  message: string
}

export function ChatBubble({ role, message }: ChatBubbleProps) {
  const isUser = role === 'user'

  return (
    <div className={cn('w-full flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[82%] rounded-xl px-4 py-3 text-h4-mobile leading-[1.35] border',
          isUser
            ? 'bg-primary-100 border-primary-100 text-neutral-900'
            : 'bg-neutral-50 border-primary-100 text-neutral-900',
        )}
      >
        {message}
      </div>
    </div>
  )
}

