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
  default: 'bg-surface-alt text-text-secondary',
  success: 'bg-success-light text-success-text',
  warning: 'bg-warning-light text-warning-text',
  danger: 'bg-danger-light text-danger-text',
  info: 'bg-info-light text-info-text',
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
