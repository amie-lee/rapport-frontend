import { ChevronLeft } from 'lucide-react'

interface TopNavBarProps {
  title: string
  onBack?: () => void
}

export function TopNavBar({ title, onBack }: TopNavBarProps) {
  return (
    <div className="w-full h-[42px] flex items-center relative">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="absolute left-0 flex items-center h-full px-2 text-neutral-900 hover:text-neutral-600 transition-colors"
          aria-label="뒤로가기"
        >
          <ChevronLeft size={20} strokeWidth={2} />
        </button>
      )}
      <span className="w-full text-center text-[17px] font-bold text-neutral-900 tracking-[-0.408px]">
        {title}
      </span>
    </div>
  )
}
