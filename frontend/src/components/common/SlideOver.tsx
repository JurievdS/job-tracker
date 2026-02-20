import { useEffect, type ReactNode } from 'react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

type SlideOverWidth = 'md' | 'lg';

interface SlideOverProps {
  /** Whether the slide-over is visible */
  isOpen: boolean;
  /** Callback when the slide-over should close */
  onClose: () => void;
  /** Panel title */
  title: string;
  /** Panel content */
  children: ReactNode;
  /** Panel width */
  width?: SlideOverWidth;
  /** Actions rendered in the header (e.g. Edit, Delete buttons) */
  headerActions?: ReactNode;
}

const widthStyles: Record<SlideOverWidth, string> = {
  md: 'max-w-md',   // ~480px
  lg: 'max-w-xl',   // ~576px
};

/**
 * SlideOver - A right-side panel overlay for detail views and forms
 *
 * Usage:
 * ```tsx
 * <SlideOver
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Application Details"
 *   headerActions={<Button onClick={...}>Edit</Button>}
 * >
 *   <div>Content here</div>
 * </SlideOver>
 * ```
 */
export function SlideOver({
  isOpen,
  onClose,
  title,
  children,
  width = 'lg',
  headerActions,
}: SlideOverProps) {
  const trapRef = useFocusTrap(isOpen);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Defer overflow change to avoid layout reflow during transition start
      requestAnimationFrame(() => {
        document.body.style.overflow = 'hidden';
      });
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 ${isOpen ? '' : 'pointer-events-none'}`}
      aria-hidden={!isOpen}
    >
      {/* Backdrop */}
      <div
        className={`
          absolute inset-0 bg-black/50 transition-opacity duration-300
          ${isOpen ? 'opacity-100 backdrop-blur-[2px]' : 'opacity-0'}
        `}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={trapRef}
        className={`
          absolute inset-y-0 right-0 w-full ${widthStyles[width]}
          bg-surface shadow-xl
          transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          flex flex-col
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="slideover-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <h2
            id="slideover-title"
            className="text-lg font-semibold text-text truncate"
          >
            {title}
          </h2>
          <div className="flex items-center gap-2">
            {headerActions}
            <button
              onClick={onClose}
              className="p-1 text-text-placeholder hover:text-text-secondary rounded-[var(--radius-md)] hover:bg-surface-alt transition-colors"
              aria-label="Close panel"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
