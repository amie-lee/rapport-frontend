import { cn } from '../../lib/utils'

interface LabelBadgeProps {
  children: React.ReactNode
  className?: string
}

export function LabelBadge({ children, className }: LabelBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center border border-[#E8EBE8] rounded-md px-2 py-0.5 text-[13px] text-[#6B736B]',
        className,
      )}
    >
      {children}
    </span>
  )
}
