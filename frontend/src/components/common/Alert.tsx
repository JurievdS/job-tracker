import type { ReactNode } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<AlertVariant, string> = {
  info: 'bg-info-light text-info-text border-info',
  success: 'bg-success-light text-success-text border-success',
  warning: 'bg-warning-light text-warning-text border-warning',
  danger: 'bg-danger-light text-danger-text border-danger',
};

const variantIcons: Record<AlertVariant, typeof Info> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  danger: XCircle,
};

/**
 * Alert - Inline contextual message
 *
 * Usage:
 * ```tsx
 * <Alert variant="danger" title="Error">
 *   Failed to save changes. Please try again.
 * </Alert>
 *
 * <Alert variant="info">
 *   Your password was updated successfully.
 * </Alert>
 * ```
 */
export function Alert({ variant = 'info', title, children, className = '' }: AlertProps) {
  const Icon = variantIcons[variant];

  return (
    <div
      className={`
        border-l-4 rounded-[var(--radius-md)] p-3 flex gap-3
        ${variantStyles[variant]}
        ${className}
      `}
      role="alert"
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="text-sm">
        {title && <p className="font-medium mb-1">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}
