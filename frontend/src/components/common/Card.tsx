import type { ReactNode } from 'react';

interface CardProps {
  /** Optional title displayed at the top of the card */
  title?: string;
  /** Card content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Makes the card clickable with hover effects */
  onClick?: () => void;
}

/**
 * Card - A container component with shadow and rounded corners
 *
 * Usage:
 * ```tsx
 * <Card title="Company Info">
 *   <p>Some content here</p>
 * </Card>
 *
 * // Clickable card
 * <Card onClick={() => navigate('/details')}>
 *   <p>Click me</p>
 * </Card>
 * ```
 */
export function Card({ title, children, className = '', onClick }: CardProps) {
  const isClickable = !!onClick;

  return (
    <div
      className={`
        bg-surface rounded-[var(--radius-lg)] shadow-sm border border-border p-[var(--padding-card)] transition-all duration-150
        ${isClickable ? 'cursor-pointer hover:shadow-md hover:border-border-hover' : ''}
        ${className}
      `}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {title && (
        <h3 className="text-lg font-semibold text-text mb-3">{title}</h3>
      )}
      {children}
    </div>
  );
}
