import { forwardRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/utils'
import { Button } from './Button'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  primaryLabel?: string
  secondaryLabel?: string
  onPrimary?: () => void
  onSecondary?: () => void
  loading?: boolean
}

const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      open,
      onClose,
      title,
      children,
      primaryLabel,
      secondaryLabel,
      onPrimary,
      onSecondary,
      loading = false,
    },
    ref,
  ) => {
    const [rendered, setRendered] = useState(false)
    const [visible, setVisible] = useState(false)

    // Mount/unmount with animation
    useEffect(() => {
      if (open) {
        setRendered(true)
        // Double rAF ensures DOM is painted before transition starts
        requestAnimationFrame(() =>
          requestAnimationFrame(() => setVisible(true)),
        )
      } else {
        setVisible(false)
        const t = setTimeout(() => setRendered(false), 300)
        return () => clearTimeout(t)
      }
    }, [open])

    // ESC key
    useEffect(() => {
      if (!open) return
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
      }
      document.addEventListener('keydown', handler)
      return () => document.removeEventListener('keydown', handler)
    }, [open, onClose])

    // Scroll lock
    useEffect(() => {
      if (open) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
      return () => {
        document.body.style.overflow = ''
      }
    }, [open])

    if (!rendered) return null

    const hasBothButtons = primaryLabel && secondaryLabel

    return createPortal(
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        {/* Backdrop */}
        <div
          className={cn(
            'absolute inset-0 bg-black/40 transition-opacity duration-300',
            visible ? 'opacity-100' : 'opacity-0',
          )}
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Panel */}
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'relative w-full bg-white z-10',
            // Mobile: bottom sheet
            'rounded-t-2xl',
            // Desktop: centered card
            'sm:rounded-2xl sm:max-w-sm sm:w-full',
            // Mobile slide-up animation
            'transition-transform duration-300 ease-out',
            visible ? 'translate-y-0' : 'translate-y-full',
            // Desktop fade+scale animation (overrides translate on sm+)
            'sm:transition-all sm:duration-300',
            visible ? 'sm:opacity-100 sm:scale-100 sm:translate-y-0' : 'sm:opacity-0 sm:scale-95 sm:translate-y-0',
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-neutral-100">
            {title && (
              <h2 id="modal-title" className="text-h3 font-bold text-neutral-900">
                {title}
              </h2>
            )}
            <button
              type="button"
              onClick={onClose}
              className="ml-auto p-1 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
              aria-label="닫기"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-5 text-body-md text-neutral-800">{children}</div>

          {/* Footer */}
          {(primaryLabel ?? secondaryLabel) && (
            <div className={cn('flex gap-3 px-5 pb-5', hasBothButtons ? '' : '')}>
              {secondaryLabel && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onSecondary}
                  disabled={loading}
                >
                  {secondaryLabel}
                </Button>
              )}
              {primaryLabel && (
                <Button
                  variant="primary"
                  className={hasBothButtons ? 'flex-1' : 'w-full'}
                  onClick={onPrimary}
                  loading={loading}
                >
                  {primaryLabel}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>,
      document.body,
    )
  },
)
Modal.displayName = 'Modal'

export { Modal }
