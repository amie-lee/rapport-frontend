import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        'text-display-mobile', 'text-display',
        'text-h1-mobile', 'text-h1',
        'text-h2-mobile', 'text-h2',
        'text-h3-mobile', 'text-h3',
        'text-h4-mobile', 'text-h4',
        'text-body-lg-mobile', 'text-body-lg',
        'text-body-md',
        'text-caption',
        'text-small',
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
