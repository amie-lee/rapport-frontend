import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'chip'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  selected?: boolean
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

const baseClasses =
  'inline-flex items-center justify-center gap-2 font-regular transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

const variantBase: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-primary-600 hover:bg-primary-800 rounded-sm',
  outline: 'border border-neutral-200 bg-white hover:bg-neutral-50 rounded-sm',
  ghost:   'hover:bg-primary-50 rounded-sm',
  chip:    'rounded-full border h-9 px-4 text-body-md',
}

const variantColor: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'text-white',
  outline: 'text-neutral-800',
  ghost:   'text-primary-600',
  chip:    'text-neutral-800',
}

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-9  px-4 text-body-md',
  md: 'h-10 px-5 text-body-md',
  lg: 'h-12 px-6 text-body-lg',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      selected,
      className,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const chipSelectedClass =
      variant === 'chip'
        ? selected
          ? 'bg-primary-50 border-primary-600 text-primary-600'
          : 'border-neutral-200 text-neutral-800 bg-white'
        : ''

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantBase[variant],
          variant !== 'chip' && sizeClasses[size],
          variantColor[variant],
          chipSelectedClass,
          className,
        )}
        disabled={disabled ?? loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? <Spinner /> : leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    )
  },
)
Button.displayName = 'Button'

export { Button }
