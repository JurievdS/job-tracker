import type { ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  /** Color variant */
  variant?: BadgeVariant;
  /** Badge content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
};

/**
 * Badge - A small label for status or categories
 *
 * Usage:
 * ```tsx
 * <Badge variant="success">Active</Badge>
 * <Badge variant="danger">Rejected</Badge>
 * <Badge>Default</Badge>
 * ```
 */
export function Badge({
  variant = 'default',
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

/**
 * Helper: Map application status to badge variant
 */
export const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  bookmarked: 'default',
  applied: 'info',
  phone_screen: 'warning',
  technical: 'warning',
  final_round: 'warning',
  offer: 'success',
  rejected: 'danger',
};

/**
 * StatusBadge - Convenience component for application statuses
 */
export function StatusBadge({ status }: { status: string }) {
  const variant = STATUS_VARIANTS[status] || 'default';
  const label = status.replace(/_/g, ' ');

  return (
    <Badge variant={variant} className="capitalize">
      {label}
    </Badge>
  );
}
