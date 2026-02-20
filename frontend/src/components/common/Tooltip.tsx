import { useState, useRef, useEffect, type ReactNode } from 'react';

interface TooltipProps {
  /** Tooltip content text */
  content: string;
  /** Element that triggers the tooltip */
  children: ReactNode;
  /** Which side to show the tooltip */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Delay before showing (ms) */
  delay?: number;
}

const positionClasses: Record<string, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
};

/**
 * Tooltip - Shows text on hover/focus
 *
 * Usage:
 * ```tsx
 * <Tooltip content="Edit application">
 *   <button><PencilIcon /></button>
 * </Tooltip>
 * ```
 */
export function Tooltip({ content, children, side = 'top', delay = 300 }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const show = () => {
    timerRef.current = setTimeout(() => setVisible(true), delay);
  };

  const hide = () => {
    clearTimeout(timerRef.current);
    setVisible(false);
  };

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <div
          className={`
            absolute z-50 px-2.5 py-1.5 text-xs font-medium whitespace-nowrap
            bg-[oklch(0.15_0.01_265)] text-white rounded-[var(--radius-sm)] shadow-md
            pointer-events-none
            animate-in fade-in duration-150
            ${positionClasses[side]}
          `}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </div>
  );
}
