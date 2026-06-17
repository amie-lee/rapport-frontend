import { forwardRef, useState } from 'react'
import { cn } from '../../lib/utils'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  type?: 'text' | 'password' | 'textarea'
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  charCount?: { current: number; max: number }
}

const baseInputClasses =
  'w-full rounded-[6px] border bg-[#F9FAF9] px-4 text-body-lg transition-colors placeholder:text-neutral-400 focus:outline-none disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed'

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type = 'text',
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      charCount,
      className,
      id,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false)

    const borderClass = error
      ? 'border-semantic-error-text focus:border-semantic-error-text'
      : 'border-neutral-100 focus:border-primary-400'

    const paddingLeft = leftIcon ? 'pl-11' : 'px-4'
    const paddingRight = type === 'password' || rightIcon ? 'pr-11' : ''

    const inputClasses = cn(
      baseInputClasses,
      borderClass,
      paddingLeft,
      paddingRight,
      type === 'textarea' ? 'h-auto min-h-[120px] py-3 resize-none' : 'h-12',
      className,
    )

    const inputType = type === 'password' ? (showPassword ? 'text' : 'password') : type === 'textarea' ? undefined : type

    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label
            htmlFor={id}
            className="text-body-md font-medium text-neutral-800"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-4 text-neutral-400 pointer-events-none">
              {leftIcon}
            </span>
          )}

          {type === 'textarea' ? (
            <textarea
              ref={ref as React.Ref<HTMLTextAreaElement>}
              id={id}
              className={inputClasses}
              {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
            />
          ) : (
            <input
              ref={ref}
              id={id}
              type={inputType}
              className={inputClasses}
              {...props}
            />
          )}

          {type === 'password' ? (
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 text-neutral-400 hover:text-neutral-600 transition-colors"
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          ) : (
            rightIcon && (
              <span className="absolute right-4 text-neutral-400 pointer-events-none">
                {rightIcon}
              </span>
            )
          )}
        </div>

        <div className="flex justify-between items-center">
          {(error ?? helperText) && (
            <span
              className={cn(
                'text-caption',
                error ? 'text-semantic-error-text' : 'text-neutral-400',
              )}
            >
              {error ?? helperText}
            </span>
          )}
          {charCount && (
            <span className="ml-auto text-caption text-neutral-400">
              {charCount.current}/{charCount.max}
            </span>
          )}
        </div>
      </div>
    )
  },
)
Input.displayName = 'Input'

export { Input }
