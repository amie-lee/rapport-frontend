import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'

interface DatePickerProps {
  value: Date | null
  onChange: (date: Date) => void
  minDate?: Date
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function DatePicker({ value, onChange, minDate }: DatePickerProps) {
  const today = startOfDay(new Date())
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const min = minDate ? startOfDay(minDate) : today

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  // pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="w-full">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
          aria-label="이전 달"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-body-lg font-medium text-neutral-900">
          {viewYear}년 {viewMonth + 1}월
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
          aria-label="다음 달"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div
            key={d}
            className="text-center text-caption text-neutral-400 py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} />
          }

          const date = new Date(viewYear, viewMonth, day)
          const isPast = startOfDay(date) < min
          const isSelected = value ? isSameDay(date, value) : false
          const isToday = isSameDay(date, today)

          return (
            <button
              key={day}
              type="button"
              disabled={isPast}
              onClick={() => onChange(date)}
              className={cn(
                'flex items-center justify-center w-9 h-9 mx-auto rounded-full text-body-md transition-colors',
                isPast && 'text-neutral-200 pointer-events-none',
                !isPast && !isSelected && 'text-neutral-800 hover:bg-neutral-50',
                isToday && !isSelected && 'font-bold',
                isSelected && 'border border-primary-600 text-primary-600 font-medium',
              )}
              aria-label={`${viewYear}년 ${viewMonth + 1}월 ${day}일`}
              aria-pressed={isSelected}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
