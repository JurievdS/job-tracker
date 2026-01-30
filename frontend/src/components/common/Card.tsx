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
        bg-white rounded-lg shadow-sm border border-gray-200 p-4
        ${isClickable ? 'cursor-pointer hover:shadow-md hover:border-gray-300 transition-all' : ''}
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
        <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
      )}
      {children}
    </div>
  );
}
