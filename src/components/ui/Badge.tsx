import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant: 'specialty' | 'status' | 'score'
  status?: '확정' | '예정' | '취소' | '대기'
  children: React.ReactNode
}

const statusClasses: Record<NonNullable<BadgeProps['status']>, string> = {
  '확정': 'bg-semantic-success-bg text-semantic-success-text',
  '예정': 'bg-semantic-info-bg text-semantic-info-text',
  '취소': 'bg-semantic-error-bg text-semantic-error-text',
  '대기': 'bg-semantic-warning-bg text-semantic-warning-text',
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant, status, className, children, ...props }, ref) => {
    const variantClass =
      variant === 'specialty'
        ? 'bg-primary-50 text-primary-600'
        : variant === 'score'
          ? 'bg-accent-50 text-accent-800'
          : statusClasses[status ?? '예정']

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2 py-1 text-small font-regular',
          variantClass,
          className,
        )}
        {...props}
      >
        {children}
      </span>
    )
  },
)
Badge.displayName = 'Badge'

export { Badge }
