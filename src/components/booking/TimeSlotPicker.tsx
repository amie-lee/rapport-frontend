import { cn } from '../../lib/utils'

export interface TimeSlotOption {
  key: string
  label: string
}

interface TimeSlotPickerProps {
  slots: TimeSlotOption[]
  value: string | null
  onChange: (slot: string) => void
}

export function TimeSlotPicker({ slots, value, onChange }: TimeSlotPickerProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {slots.map((slot) => {
        const isSelected = slot.key === value
        return (
          <button
            key={slot.key}
            type="button"
            onClick={() => onChange(slot.key)}
            className={cn(
              'w-full border rounded-full px-3 py-2 text-body-md transition-colors text-center',
              isSelected
                ? 'border-primary-600 bg-primary-50 text-primary-600'
                : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50',
            )}
            aria-pressed={isSelected}
          >
            {slot.label}
          </button>
        )
      })}
    </div>
  )
}
